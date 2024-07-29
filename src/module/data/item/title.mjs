import FeatureModel from "./feature.mjs";

export default class TitleModel extends FeatureModel {
  static metadata = Object.freeze({
    type: "title"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Feature",
    "DRAW_STEEL.Item.Title"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
