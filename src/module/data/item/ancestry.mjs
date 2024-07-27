import BaseItemModel from "./base.mjs";

export default class AncestryModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "ancestry"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Ancestry"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
