export default class BaseCombatModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Combat subtype
   */
  static metadata = Object.freeze({
    type: "base",
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Combat.base"];

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }
}
