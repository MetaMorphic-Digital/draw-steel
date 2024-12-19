import AdvancementModel from "./advancement.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends AdvancementModel {
  static metadata = Object.freeze({
    ...super.metadata,
    type: "culture",
    invalidActorTypes: ["npc"]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Culture"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    return schema;
  }
}
