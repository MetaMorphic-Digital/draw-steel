import BaseItemModel from "./base.mjs";

export default class KitModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "kit"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Kit"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
