/**
 * Baseline model for Combatant Group subtype-specific behavior
 */
export default class BaseCombatantGroupModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this CombatantGroup subtype
   */
  static metadata = Object.freeze({
    type: "base",
  });

  static defineSchema() {
    return {};
  }
}
