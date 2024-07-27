import BaseItemModel from "./base.mjs";

export default class CultureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "culture"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Culture"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.environment = new fields.StringField();
    schema.organization = new fields.StringField();
    schema.upbringing = new fields.StringField();

    return schema;
  }
}
