import FeatureModel from "./feature.mjs";

/**
 * A complication is an optional feature that provides both a positive benefit and a negative drawback.
 */
export default class ComplicationModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "complication",
      invalidActorTypes: ["npc"],
      detailsPartial: null,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.complication");
}
