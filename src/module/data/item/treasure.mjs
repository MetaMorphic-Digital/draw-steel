import { systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 */

/**
 * Treasure are supernatural items that provide benefits beyond what a kit can provide.
 */
export default class TreasureModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "treasure",
      detailsPartial: [systemPath("templates/sheets/item/partials/treasure.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.treasure");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.kind = new fields.StringField({ required: true });
    schema.category = new fields.StringField({ required: true });
    schema.echelon = new fields.NumberField({ initial: 1, integer: true });

    schema.keywords = new fields.SetField(setOptions());

    schema.quantity = requiredInteger({ initial: 1 });

    schema.project = new fields.SchemaField({
      prerequisites: new fields.StringField({ required: true }),
      source: new fields.StringField({ required: true }),
      rollCharacteristic: new fields.SetField(setOptions()),
      goal: new fields.NumberField(),
      yield: new fields.SchemaField({
        amount: new FormulaField({ initial: "1" }),
        display: new fields.StringField({ required: true }),
      }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "treasure");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      includeProjectInfo: config.includeProjectInfo !== false,
    };
    context.enrichedDescription = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });
    await this.getSheetContext(context);

    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });
    const keywordList = Array.from(this.keywords).map(keyword => context.keywords.find(k => k.value === keyword)?.label ?? keyword);
    keywordList.sort((a, b) => a.localeCompare(b));
    context.formattedKeywords = keywordFormatter.format(keywordList);

    if (context.includeProjectInfo) {
      const characteristicFormatter = game.i18n.getListFormatter({ type: "disjunction" });
      const characteristicList = Array.from(this.project.rollCharacteristic).map(c => ds.CONFIG.characteristics[c]?.label ?? c);
      context.formattedCharacteristics = characteristicFormatter.format(characteristicList);
    }

    const treasureBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/treasure.hbs"), context);
    embed.insertAdjacentHTML("beforeend", treasureBody);
    return embed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    context.categories = Object.entries(ds.CONFIG.equipment.categories).map(([value, { label }]) => ({ value, label }));

    context.kinds = Object.entries(ds.CONFIG.equipment.kinds).map(([value, { label }]) => ({ value, label }));

    context.echelons = Object.entries(ds.CONFIG.echelons).map(([value, { label }]) => ({ value, label }));

    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));

    context.keywords = Object.entries(ds.CONFIG.equipment.keywords).map(([value, { label }]) => ({ value, label }));

    if (this.category) context.keywords.push(...ds.CONFIG.equipment.categories[this.category].keywords);
    if (this.kind) {
      for (const [value, { label }] of Object.entries(ds.CONFIG.equipment[this.kind])) {
        context.keywords.push({ value, label, group: ds.CONFIG.equipment.kinds[this.kind].label });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Creates a project for this equipment on the provided actor.
   * @param {DrawSteelActor} actor
   * @returns {DrawSteelItem}
   */
  async createProject(actor) {
    if (!actor) return;

    const name = game.i18n.format("DRAW_STEEL.Item.project.Craft.ItemName", { name: this.parent.name });
    return Item.create({ name, type: "project", "system.yield.item": this.parent.uuid }, { parent: actor });
  }
}
