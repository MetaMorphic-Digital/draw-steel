import BaseItemModel from "./base.mjs";

export default class FeatureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "feature"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Feature"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
