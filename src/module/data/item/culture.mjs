import AdvancementModel from "./advancement.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "culture",
      invalidActorTypes: ["npc"],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Culture",
  ];
}
