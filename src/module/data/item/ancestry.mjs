import BaseItemModel from "./base.mjs";

/**
 * Ancestries describe how a hero was born and grant benefits from their anatomy and physiology
 */
export default class AncestryModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "ancestry",
    invalidActorTypes: ["npc"]
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
