import BaseItemModel from "./base.mjs";

export default class EquipmentModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "equipment"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Equipment"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = CONFIG.DRAW_STEEL.equipment;

    schema.kind = new fields.StringField({required: true, choices: config.kind, blank: true});
    schema.category = new fields.StringField({required: true});

    return schema;
  }
}
