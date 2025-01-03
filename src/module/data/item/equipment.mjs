import {systemPath} from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Equipment covers all physical items that provide special benefits beyond the base kit
 */
export default class EquipmentModel extends BaseItemModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "equipment",
    detailsPartial: [systemPath("templates/item/partials/equipment.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Equipment"
  ];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.kind = new fields.StringField({required: true, blank: true});
    schema.category = new fields.StringField({required: true});
    schema.echelon = new fields.NumberField({initial: 1, integer: true});

    schema.keywords = new fields.SetField(new fields.StringField({required: true, blank: false}));

    schema.prerequisites = new fields.StringField();

    schema.project = new fields.SchemaField({
      source: new fields.StringField(),
      rollCharacteristic: new fields.SetField(new fields.StringField({required: true, blank: false})),
      goal: new fields.NumberField(),
      yield: new fields.StringField()
    });

    return schema;
  }

  /** @override */
  getSheetContext(context) {
    context.categories = Object.entries(ds.CONFIG.equipment.categories).map(([value, {label}]) => ({value, label}));

    context.kinds = Object.entries(ds.CONFIG.equipment.kinds).map(([value, {label}]) => ({value, label}));

    context.echelons = Object.entries(ds.CONFIG.echelons).map(([value, {label}]) => ({value, label}));

    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, {label}]) => ({value, label}));

    context.keywords = Object.entries(ds.CONFIG.abilities.keywords).map(([value, {label}]) => ({value, label}));
    if (this.category) context.keywords.push(...ds.CONFIG.equipment.categories[this.category].keywords);
    if (this.kind) {
      for (const [value, {label}] of Object.entries(ds.CONFIG.equipment[this.kind])) {
        context.keywords.push({value, label});
      }
    }
  }
}
