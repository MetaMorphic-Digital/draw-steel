import {systemPath} from "../../constants.mjs";
import {DrawSteelChatMessage} from "../../documents/chat-message.mjs";
import {DSRoll, ProjectRoll} from "../../rolls/_module.mjs";
import FormulaField from "../fields/formula-field.mjs";
import {setOptions} from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/** @import {PowerRollModifiers} from  "../../_types.js"*/

const fields = foundry.data.fields;

/**
 * Projects are activities (crafting, research, or other) characters can accomplish during downtime.
 */
export default class ProjectModel extends BaseItemModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "project",
    detailsPartial: [systemPath("templates/item/partials/project.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Project"
  ];

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.type = new fields.StringField({required: true});
    schema.prerequisites = new fields.StringField({required: true});
    schema.projectSource = new fields.StringField({required: true});
    schema.rollCharacteristic = new fields.SetField(setOptions());
    schema.goal = new fields.NumberField({required: true, integer: true, positive: true, initial: 1});
    schema.progress = new fields.NumberField({required: true, integer: true, min: 0, initial: 0});
    schema.yield = new fields.SchemaField({
      item: new fields.DocumentUUIDField(),
      amount: new FormulaField({initial: "1"}),
      display: new fields.StringField()
    });

    return schema;
  }

  /** @override */
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

  /** @override */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // If creating with item UUID, transfer the item project data to the project item
    const itemUUID = data.system?.yield?.item;
    const yieldItem = await fromUuid(itemUUID);
    if (yieldItem?.type === "equipment") {
      const {prerequisites, rollCharacteristic, goal, source} = yieldItem.system.project;
      this.updateSource({
        prerequisites,
        rollCharacteristic,
        goal,
        projectSource: source,
        yield: {
          item: itemUUID,
          amount: yieldItem.system.project.yield.amount,
          display: yieldItem.system.project.yield.display
        }
      });
    }
  }

  /**
   * @override
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG
    };
    this.getSheetContext(context);

    const embed = document.createElement("div");
    embed.classList.add("project");
    embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const projectBody = await renderTemplate(systemPath("templates/item/embeds/project.hbs"), context);
    embed.insertAdjacentHTML("beforeend", projectBody);
    return embed;
  }

  /** @override */
  async getSheetContext(context) {
    context.typeOptions = Object.entries(ds.CONFIG.projects.types).map(([value, {label}]) => ({value, label}));
    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, {label}]) => ({value, label}));

    const characteristicFormatter = game.i18n.getListFormatter({type: "disjunction"});
    const characteristicList = Array.from(this.rollCharacteristic).map(c => ds.CONFIG.characteristics[c]?.label ?? c);
    context.formattedCharacteristics = characteristicFormatter.format(characteristicList);

    if (this.yield.item) context.itemLink = await TextEditor.enrichHTML(`@UUID[${this.yield.item}]`);
  }

  /**
   * Make a project roll for this project and create any yielded items if goal is met
   * @param {Partial<PowerRollModifiers>} [options={}]
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async roll(options = {}) {
    if (!this.actor) return null;

    const rollData = this.parent.getRollData();
    const rollKey = ds.CONFIG.characteristics[this.characteristic]?.rollKey ?? "";

    const promptValue = await ProjectRoll.prompt({
      formula: rollKey ? `2d10 + @${rollKey}` : "2d10",
      modifiers: options.modifiers ?? {},
      actor: this.actor,
      evaluation: "evaluate",
      data: rollData,
      flavor: this.parent.name
    });

    if (!promptValue) return null;
    const {rollMode, projectRoll} = promptValue;

    const total = projectRoll.total;
    const updatedProgress = this.progress + total;
    await this.parent.update({"system.progress": updatedProgress});

    // If the project has been completed and there is a yield item, notify the user.
    // If there is a yielded item, roll the amount formula and add that many of the item.
    if (updatedProgress >= this.goal) {
      ui.notifications.info("DRAW_STEEL.Item.Project.CompletedNotification", {format: {
        actor: this.actor.name,
        project: this.parent.name
      }});

      if (this.yield.item) {
        const item = await fromUuid(this.yield.item);
        const yieldRoll = await new DSRoll(this.yield.amount).evaluate();
        const amount = yieldRoll.total;
        const itemArray = Array(amount).fill(item.toObject());

        await this.actor.createEmbeddedDocuments("Item", itemArray);
        ui.notifications.info("DRAW_STEEL.Item.Project.Craft.CompletedNotification", {format: {
          actor: this.actor.name,
          amount,
          item: item.name
        }});
      }
    }

    const messageData = {
      speaker: DrawSteelChatMessage.getSpeaker({actor: this.actor}),
      rolls: [projectRoll],
      content: this.parent.name,
      flavor: game.i18n.localize("DRAW_STEEL.Roll.Project.Label")
    };
    DrawSteelChatMessage.applyRollMode(messageData, rollMode);

    return DrawSteelChatMessage.create(messageData);
  }
}
