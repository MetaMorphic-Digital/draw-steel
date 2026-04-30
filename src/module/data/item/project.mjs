import { DSRoll, ProjectRoll } from "../../rolls/_module.mjs";
import { systemID, systemPath } from "../../constants.mjs";
import BaseItemModel from "./base-item.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import FormulaField from "../fields/formula-field.mjs";
import PowerRollDialog from "../../applications/apps/power-roll-dialog.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { setOptions } from "../helpers.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import { DatabaseCreateOperation } from "@common/abstract/_types.mjs";
 * @import { ProjectRollModifiers, ProjectRollPrompt, ProjectRollPromptOptions } from  "../../_types.js";
 * @import { DrawSteelItem, DrawSteelActiveEffect } from "../../documents/_module.mjs";
 */

const fields = foundry.data.fields;

/**
 * A task a hero undertakes during one or more respites.
 */
export default class ProjectModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "project",
      invalidActorTypes: ["npc", "object", "party"],
      detailsPartial: [systemPath("templates/sheets/item/partials/project.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.project");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.type = new fields.StringField({ required: true });
    schema.prerequisites = new fields.StringField({ required: true });
    schema.projectSource = new fields.StringField({ required: true });
    schema.rollCharacteristic = new fields.SetField(setOptions());
    schema.goal = new fields.NumberField({ nullable: true, integer: true, min: 1 });
    schema.points = new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 });
    schema.events = new fields.DocumentUUIDField({ initial: "Compendium.draw-steel.tables.RollTable.ebiZk3Sfa6Jw1JKk", type: "RollTable" });
    schema.yield = new fields.SchemaField({
      document: new fields.DocumentUUIDField(),
      amount: new FormulaField({ initial: "1" }),
      display: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    // 1.1 migration
    foundry.abstract.Document._addDataFieldMigration(data, "yield.item", "yield.document");

    return super.migrateData(data);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.points ??= 0;

    this.projectType = _loc(ds.CONFIG.projects.types[this.type]?.label ?? "");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // If creating with a doment UUID, transfer the document's project data to the project item.
    const uuid = data.system?.yield?.document;
    const yieldDocument = await fromUuid(uuid);
    if ((yieldDocument?.type === "treasure") || (yieldDocument.documentName === "ActiveEffect")) {
      const { prerequisites, rollCharacteristic, goal, source } = yieldDocument.system.project;
      this.parent.updateSource({
        img: yieldDocument.img,
        system: {
          type: "crafting",
          prerequisites,
          rollCharacteristic,
          goal,
          projectSource: source,
          yield: {
            item: uuid,
            amount: yieldDocument.system.project.yield.amount,
            display: yieldDocument.system.project.yield.display,
          },
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (foundry.utils.hasProperty(changes, "system.points") && this.actor) {
      // Mark the project for completion only if the points meet the goal and it hasn't already been completed.
      options.completeProject = !!this.goal && (changes.system.points >= this.goal) && (this.points < this.goal);
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    // When the project is completed, notify the user and create any yielded item.
    if ((game.userId === userId) && options.completeProject) {
      ui.notifications.success("DRAW_STEEL.Item.project.CompletedNotification", {
        format: {
          actor: this.actor.name,
          project: this.parent.name,
        },
      });

      if (this.yield.document) this.completeCraftingProject();
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
      enrichedDescription: await enrichHTML(this.description.value, { ...options, relativeTo: this.parent }),
    };
    await this.getSheetContext(context);

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "project");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const projectBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/project.hbs"), context);
    embed.insertAdjacentHTML("beforeend", projectBody);
    return embed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    context.typeOptions = Object.entries(ds.CONFIG.projects.types).map(([value, { label }]) => ({ value, label }));
    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));

    const characteristicFormatter = game.i18n.getListFormatter({ type: "disjunction" });
    const characteristicList = Array.from(this.rollCharacteristic).map(c => ds.CONFIG.characteristics[c]?.label ?? c);
    context.formattedCharacteristics = characteristicFormatter.format(characteristicList);

    if (this.yield.document) {
      const item = await fromUuid(this.yield.document);
      context.itemLink = item?.toAnchor().outerHTML;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Make a project roll for this project and update the project points progress.
   * @param {Partial<ProjectRollModifiers>} [config={}]   Roll options.
   * @param {ApplicationConfiguration} [dialogOptions={}] Options to be forwarded to the roll dialog.
   * @param {DatabaseCreateOperation} [messageOptions]    Options to be forwarded to the final created chat message.
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async roll(config = {}, dialogOptions = {}, messageOptions = {}) {
    if (!this.actor) {
      console.error("To roll a project, it must have an actor owner");
      return null;
    }

    const promptValue = await this.rollPrompt(config, dialogOptions);

    if (!promptValue) return null;
    const { messageMode, projectRoll } = promptValue;
    if (projectRoll.isCritical) projectRoll.options.flavor = _loc("DRAW_STEEL.ROLL.Project.Breakthrough");

    const total = projectRoll.total;
    const previousPoints = this.points;
    const updatedPoints = previousPoints + total;
    await this.parent.update({ "system.points": updatedPoints });

    const projectPartId = "project".padEnd(16, "0");

    const event = game.settings.get(systemID, "projectEvents") === "milestone" ? !!this.milestoneEventsOccurred(previousPoints, updatedPoints) : null;

    const messageData = foundry.utils.mergeObject({
      type: "standard",
      system: {
        parts: {
          [projectPartId]: {
            event,
            _id: projectPartId,
            type: "project",
            flavor: this.parent.name,
            projectUuid: this.parent.uuid,
            rolls: [projectRoll],
          },
        },
      },
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
      rolls: [projectRoll],
      title: this.parent.name,
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    }, messageOptions.data ?? {});

    if (event) {
      const contentId = "content".padEnd(16, "0");
      messageData.content = _loc("DRAW_STEEL.Item.project.Events.EventTriggered");
      messageData.system.parts[contentId] = { _id: contentId, type: "content" };
    }

    delete messageOptions.data;

    DrawSteelChatMessage.applyMode(messageData, messageMode);
    return DrawSteelChatMessage.create(messageData, messageOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the player to roll this project.
   * @param {Partial<ProjectRollPromptOptions>} [config={}]
   * @param {ApplicationConfiguration} [dialogOptions={}]
   * @returns {Promise<ProjectRollPrompt>}
   */
  async rollPrompt(config = {}, dialogOptions = {}) {
    const rollData = config.follower ? config.follower.getRollData() : this.parent.getRollData();

    // Pick the highest characteristic amongst the roll characteristics
    let chr = null;
    const characteristicData = config.follower?.system.characteristics ?? this.actor.system.characteristics;
    for (const characteristic of this.rollCharacteristic) {
      if (chr === null) chr = characteristic;
      else if (characteristicData[characteristic].value > characteristicData[chr].value) chr = characteristic;
    }

    const rollKey = ds.CONFIG.characteristics[chr]?.rollKey ?? "";
    const rollFormula = rollKey && config.follower ? `item.${rollKey}` : rollKey;

    const formula = rollKey ? `2d10 + @${rollFormula}` : "2d10";

    const dialogConfig = foundry.utils.mergeObject({
      context: {
        modifiers: config.modifiers ?? {},
        formula: ProjectRoll.replaceFormulaData(formula, rollData, { missing: "0" }),
        skills: (config.follower ?? this.actor).system.skills?.value ?? null,
        skillModifiers: (config.follower ?? this.actor).system.skills?.modifiers ?? null,
      },
      window: {
        title: this.parent.name,
      },
    }, dialogOptions);

    const fd = await PowerRollDialog.create(dialogConfig);

    if (!fd) return null;

    const projectRoll = new ProjectRoll(formula, rollData, {
      flavor: config.flavor ?? _loc("DRAW_STEEL.ROLL.Project.Label"),
      ...fd.rolls[0],
    });

    await projectRoll.evaluate();

    return { projectRoll, messageMode: fd.messageMode };
  }

  /* -------------------------------------------------- */

  /**
   * Spend a variable amount of the actor's project points from their career on this project.
   */
  async spendCareerPoints() {
    if (!this.actor) return console.error("This project has no owner actor.");
    if (!this.actor.system.career) return console.error("The project owner has no career.");

    const careerPoints = this.actor.system.career.system.projectPoints ?? 0;
    if (!careerPoints) return console.warn("No career points available.");

    const pointsToCompletion = Math.max(0, this.goal - this.points);
    if (!pointsToCompletion) return console.warn("Project already completed");

    const input = foundry.applications.elements.HTMLRangePickerElement.create({
      min: 0,
      name: "spendPoints",
      max: Math.min(careerPoints, pointsToCompletion),
      step: 1,
    });

    const formGroup = new foundry.applications.fields.createFormGroup({
      input,
      classes: ["stacked"],
      label: "DRAW_STEEL.Item.project.SpendCareerPoints.Label",
      localize: true,
    });

    const fd = await ds.applications.api.DSDialog.input({
      content: formGroup.outerHTML,
      window: { title: "DRAW_STEEL.Item.project.SpendCareerPoints.Title" },
    });

    if (fd?.spendPoints > 0) {
      await this.parent.update({ "system.points": this.points + fd.spendPoints });
      await this.actor.system.career.update({ "system.projectPoints": careerPoints - fd.spendPoints });

      ui.notifications.success("DRAW_STEEL.Item.project.SpendCareerPoints.Success", {
        format: {
          actor: this.actor.name,
          points: fd.spendPoints,
          project: this.parent.name,
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Perform the creation of the yielded item(s) when a crafting project is completed.
   */
  async completeCraftingProject() {
    if (!this.actor) return console.error("This project has no owner actor.");

    const doc = await fromUuid(this.yield.document);
    const yieldRoll = await new DSRoll(this.yield.amount).evaluate();
    const amount = yieldRoll.total;

    if (doc.documentName === "Item") await this._createCraftedItem(doc, amount);
    else if (doc.documentName === "ActiveEffect") await this._createCraftedEffect(doc, amount);

    const labelSuffix = game.i18n.pluralRules.select(amount);

    ui.notifications.success(`DRAW_STEEL.Item.project.Craft.CompletedNotification.${labelSuffix}`, {
      format: {
        actor: this.actor.name,
        amount,
        item: doc.name,
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Perform the item creation and updates when the yielded document is an Item.
   * @param {DrawSteelItem} doc    The document yielded from this project.
   * @param {number} amount        The amount yielded.
   * @protected
   */
  async _createCraftedItem(doc, amount) {
    // If there's an existing item, add the amount to the item's quantity, otherwise create a new item with the quantity amount
    const existingItem = this.actor.items.find(i => i.dsid === doc.dsid);
    if (existingItem) {
      await existingItem.update({ "system.quantity": existingItem.system.quantity + amount });
    } else {
      const itemData = game.items.fromCompendium(doc, { clearFolder: true });
      itemData.system.quantity = amount;
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Perform the item creation and updates when the yielded document is an Item.
   * @param {DrawSteelActiveEffect} doc   The document yielded from this project.
   * @param {number} amount               The amount yielded.
   * @protected
   */
  async _createCraftedEffect(doc, amount) {
    // Prompt for adding to existing item, or adding to a new item.
    const treasures = this.actor.items.documentsByType.treasure
      .filter(treasure => (treasure.system.category === "leveled") && (treasure.system.kind === doc.system.project.yield.kind))
      .map(treasure => ({ label: treasure.name, value: treasure.id }));
    const { createFormGroup, createSelectInput } = foundry.applications.fields;

    const content = document.createElement("div");

    content.append(createFormGroup({
      label: "DRAW_STEEL.Item.project.Craft.EffectDialog.Label",
      hint: "DRAW_STEEL.Item.project.Craft.EffectDialog.Hint",
      localize: true,
      input: createSelectInput({
        name: "treasure",
        options: treasures,
        blank: "",
      }),
    }));

    const fd = await ds.applications.api.DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.Item.project.Craft.EffectDialog.Title",
        icon: ds.CONFIG.equipment.kinds[doc.system.project.yield.kind ?? "other"].icon,
      },
    });

    let item;
    if (fd?.treasure) item = this.actor.items.get(fd.treasure);
    else {
      const defaultName = getDocumentClass("Item").defaultName({ type: "treasure", parent: this.actor });
      item = await getDocumentClass("Item").create({
        name: defaultName,
        type: "treasure",
        system: {
          category: "leveled",
          kind: doc.system.project.yield.kind,
        },
      }, { parent: this.actor });
    }

    const effectData = doc.toObject();
    effectData.transfer = true;
    await item.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  /* -------------------------------------------------- */

  /**
   * An array of numbers at which a milestone event would happen.
   * @type {number[]}
   */
  get milestoneEventThresholds() {
    if (!this.goal) return [];
    const milestone = ds.CONFIG.projects.milestones.find(milestone => (this.goal >= milestone.min) && (this.goal <= milestone.max));
    const events = milestone?.events ?? 0;

    const eventThresholds = [];
    if (!events) return eventThresholds;

    for (let i = 1; i <= events; i++) {
      const threshold = Math.floor(i / (events + 1) * this.goal);
      eventThresholds.push(threshold);
    }

    return eventThresholds;
  }

  /* -------------------------------------------------- */

  /**
   * Determine how many project events occur based on milestone thresholds.
   * @param {number} previousPoints The project points before the project roll.
   * @param {number} updatedPoints  The project points after the project roll.
   * @returns {number}
   */
  milestoneEventsOccurred(previousPoints, updatedPoints) {
    const thresholds = this.milestoneEventThresholds;
    if (thresholds.length === 0) return 0;

    let eventsOccured = 0;
    for (const threshold of thresholds) {
      if ((previousPoints < threshold) && (updatedPoints >= threshold)) eventsOccured++;
    }

    return eventsOccured;
  }

  /* -------------------------------------------------- */

  /**
   * Draw an event from the provided events roll table.
   */
  async drawEventsTable() {
    const table = await fromUuid(this.events);
    if (!table) return void ui.notifications.error("DRAW_STEEL.Item.project.Events.NoTable", { localize: true });

    table.draw();
  }
}
