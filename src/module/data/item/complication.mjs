import AdvancementModel from "./advancement.mjs";

/**
 * A complication is an optional feature that provides both a positive benefit and a negative drawback
 */
export default class ComplicationModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "complication",
      packOnly: false,
      invalidActorTypes: ["npc"],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.complication");
}
