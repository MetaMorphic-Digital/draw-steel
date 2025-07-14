/** @import {DrawSteelCombat} from "../../documents/combat.mjs" */

const fields = foundry.data.fields;

/**
 * Baseline model for Combatant Group subtype-specific behavior
 */
export default class BaseCombatantGroupModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this CombatantGroup subtype
   */
  static get metadata() {
    return {
      type: "base",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Returns the parent combat that the combatant group is in. Can be null if the
   * CombatantGroup is only created in memory with "new".
   * @returns {DrawSteelCombat | null}
   */
  get combat() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (changed.system && ("staminaValue" in changed.system)) this.refreshSquad();
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the token resource bars, token HUD, and actor sheets for each combatant within the group.
   * Is triggered on stamina updates and each combatants updates and deletions.
   */
  refreshSquad() {
    for (const combatant of this.parent.members) {
      combatant.refreshCombatant();
    }
    this.combat?._refreshTokenHUD(this.parent.members);
  }
}
