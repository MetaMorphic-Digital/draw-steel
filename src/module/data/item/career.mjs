import BaseItemModel from "./base.mjs";

export default class CareerModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "career"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Career"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
