
/**
 * A model to store system-specific information about combats
 */
export default class BaseCombatModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Combat subtype
   */
  static get metadata() {
    return {
      type: "base",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Combat.base"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }
}
