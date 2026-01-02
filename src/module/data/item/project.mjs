import { systemPath } from "../../constants.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import { DSRoll, ProjectRoll } from "../../rolls/_module.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 * @import { PowerRollModifiers } from  "../../_types.js"
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
      item: new fields.DocumentUUIDField(),
      amount: new FormulaField({ initial: "1" }),
      display: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  preparePostActorPrepData() {
    super.preparePostActorPrepData();

    // Set the highest characteristic amongst the roll characteristics
    this.characteristic = null;
    for (const characteristic of this.rollCharacteristic) {
      if (this.characteristic === null) this.characteristic = characteristic;

      const actorCharacteristics = this.actor.system.characteristics;
      if (actorCharacteristics[characteristic].value > actorCharacteristics[this.characteristic].value) this.characteristic = characteristic;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // If creating with item UUID, transfer the item project data to the project item
    const itemUUID = data.system?.yield?.item;
    const yieldItem = await fromUuid(itemUUID);
    if (yieldItem?.type === "treasure") {
      const { prerequisites, rollCharacteristic, goal, source } = yieldItem.system.project;
      this.parent.updateSource({
        img: yieldItem.img,
        system: {
          type: "crafting",
          prerequisites,
          rollCharacteristic,
          goal,
          projectSource: source,
          yield: {
            item: itemUUID,
            amount: yieldItem.system.project.yield.amount,
            display: yieldItem.system.project.yield.display,
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

      if (this.yield.item) this.completeCraftingProject();
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

    if (this.yield.item) {
      const item = await fromUuid(this.yield.item);
      context.itemLink = item?.toAnchor().outerHTML;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Make a project roll for this project and update the project points progress.
   * @param {Partial<PowerRollModifiers>} [options={}]
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async roll(options = {}) {
    if (!this.actor) {
      console.error("To roll a project, it must have an actor owner");
      return null;
    }

    const promptValue = await this.rollPrompt(options);

    if (!promptValue) return null;
    const { rollMode, projectRoll } = promptValue;

    const total = projectRoll.total;
    const previousPoints = this.points;
    const updatedPoints = previousPoints + total;
    await this.parent.update({ "system.points": updatedPoints });

    const messageData = {
      system: {
        uuid: this.parent.uuid,
        events: this.milestoneEventsOccured(previousPoints, updatedPoints),
      },
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
      rolls: [projectRoll],
      title: this.parent.name,
      content: this.parent.name,
      flavor: game.i18n.localize("DRAW_STEEL.ROLL.Project.Label"),
      flags: { core: { canPopout: true } },
    };

    return await projectRoll.toMessage(messageData, { rollMode });
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the player to roll this project.
   * @param {Partial<PowerRollModifiers>} [options={}]
   * @returns {ProjectRollPrompt}
   */
  async rollPrompt(options = {}) {
    const rollData = this.parent.getRollData();
    const rollKey = ds.CONFIG.characteristics[this.characteristic]?.rollKey ?? "";

    const promptValue = await ProjectRoll.prompt({
      formula: rollKey ? `2d10 + @${rollKey}` : "2d10",
      modifiers: options.modifiers ?? {},
      actor: this.actor,
      evaluation: "evaluate",
      data: rollData,
      flavor: this.parent.name,
    });

    return promptValue;
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

    const item = await fromUuid(this.yield.item);
    const existingItem = this.actor.items.find(i => i.dsid === item.dsid);
    const yieldRoll = await new DSRoll(this.yield.amount).evaluate();
    const amount = yieldRoll.total;

    // If there's an existing item, add the amount to the item's quantity, otherwise create a new item with the quantity amount
    if (existingItem) {
      await existingItem.update({ "system.quantity": existingItem.system.quantity + amount });
    } else {
      const itemData = game.items.fromCompendium(item, { clearFolder: true });
      itemData.system.quantity = amount;
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    ui.notifications.success("DRAW_STEEL.Item.project.Craft.CompletedNotification", {
      format: {
        actor: this.actor.name,
        amount,
        item: item.name,
      },
    });
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
  milestoneEventsOccured(previousPoints, updatedPoints) {
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
