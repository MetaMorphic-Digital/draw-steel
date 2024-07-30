import BaseItemModel from "./base.mjs";

export default class ComplicationModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "complication",
    invalidActorTypes: ["npc"]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Complication"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
