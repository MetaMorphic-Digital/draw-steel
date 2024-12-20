import AdvancementModel from "./advancement.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends AdvancementModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "culture",
    invalidActorTypes: ["npc"]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Culture"
  ];
}
