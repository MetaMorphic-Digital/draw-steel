export default class BaseCombatModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({
    type: "base"
  });

  /** @override */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Combat.base"];

  /** @override */
  static defineSchema() {
    return {};
  }
}
