import AdvancementModel from "./advancement.mjs";

/**
 * Ancestries describe how a hero was born and grant benefits from their anatomy and physiology
 */
export default class AncestryModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "ancestry",
      invalidActorTypes: ["npc"],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.Ancestry");
}
