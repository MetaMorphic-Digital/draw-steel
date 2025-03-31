const fields = foundry.data.fields;

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

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }

  /**
   * Refresh the token bars and HUD for each token within the group.
   * Is triggered on stamina updates and each combatants updates and deletions.
   */
  refreshTokens() {
    for (const combatant of this.parent.members) {
      combatant.token?.object?.renderFlags.set({ refreshBars: true });
    }
    const [firstCombatant] = this.parent.members;
    firstCombatant?.combat._refreshTokenHUD(this.parent.members);
  }
}
