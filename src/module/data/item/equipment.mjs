import { systemPath } from "../../constants.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/** @import { DrawSteelActor } from "../../documents/_module.mjs"; */

/**
 * Equipment covers all physical items that provide special benefits beyond the base kit
 */
export default class EquipmentModel extends BaseItemModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "equipment",
    detailsPartial: [systemPath("templates/item/partials/equipment.hbs")],
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Equipment",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.kind = new fields.StringField({ required: true, blank: true });
    schema.category = new fields.StringField({ required: true });
    schema.echelon = new fields.NumberField({ initial: 1, integer: true });

    schema.keywords = new fields.SetField(setOptions());

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

  /** @inheritdoc */
  getSheetContext(context) {
    context.categories = Object.entries(ds.CONFIG.equipment.categories).map(([value, { label }]) => ({ value, label }));

    context.kinds = Object.entries(ds.CONFIG.equipment.kinds).map(([value, { label }]) => ({ value, label }));

    context.echelons = Object.entries(ds.CONFIG.echelons).map(([value, { label }]) => ({ value, label }));

    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));

    context.keywords = Object.entries(ds.CONFIG.abilities.keywords).map(([value, { label }]) => ({ value, label }));
    if (this.category) context.keywords.push(...ds.CONFIG.equipment.categories[this.category].keywords);
    if (this.kind) {
      for (const [value, { label }] of Object.entries(ds.CONFIG.equipment[this.kind])) {
        context.keywords.push({ value, label });
      }
    }
  }

  /**
   * Creates the provided equipment item as a project on a given actor
   * @param {DrawSteelActor} actor
   */
  async createProject(actor) {
    if (!actor) return;

    const name = game.i18n.format("DRAW_STEEL.Item.Project.Craft.ItemName", { name: this.parent.name });
    await Item.create({ name, type: "project", "system.yield.item": this.parent.uuid }, { parent: actor });
  }
}
