/** @import {DrawSteelCombat} from "../../documents/combat.mjs" */

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
   * Returns the parent combat that the combatant group is in. Can be null if the CombatantGroup is only created in memory with "new"
   * @returns {DrawSteelCombat | null}
   */
  get combat() {
    return this.parent.parent;
  }

  /**
   * Refresh the token bars and HUD for each token within the group.
   * Is triggered on stamina updates and each combatants updates and deletions.
   */
  refreshTokens() {
    for (const combatant of this.parent.members) {
      combatant.token?.object?.renderFlags.set({ refreshBars: true });
    }
    this.combat?._refreshTokenHUD(this.parent.members);
  }
}
