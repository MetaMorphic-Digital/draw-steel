import FeatureModel from "./feature.mjs";

/**
 * A dramatic narrative twist that deepens a hero’s backstory and gives them a rules benefit and drawback.
 */
export default class ComplicationModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "complication",
      invalidActorTypes: ["npc", "object"],
      detailsPartial: null,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.complication");
}
