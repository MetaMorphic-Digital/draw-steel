import BaseItemModel from "./base.mjs";

export default class ClassModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "class"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Class"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
