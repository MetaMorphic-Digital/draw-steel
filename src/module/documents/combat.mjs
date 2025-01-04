import {systemID} from "../constants.mjs";
/** @import {DrawSteelCombatant} from "./combatant.mjs" */

export class DrawSteelCombat extends Combat {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatData", this);
  }

  /** @override */
  async startCombat() {
    for (const combatant of this.combatants) {
      await combatant.actor.system.startCombat(combatant);
    }

    return super.startCombat();
  }

  /** @override */
  async nextRound() {
    await super.nextRound();
    if (game.settings.get(systemID, "initiativeMode") !== "default") return;
    const combatantUpdates = this.combatants.map(c => ({_id: c.id, initiative: c.actor?.system.combat.turns ?? 1}));
    this.updateEmbeddedDocuments("Combatant", combatantUpdates);
  }

  /**
   * @param {DrawSteelCombatant} a Some combatant
   * @param {DrawSteelCombatant} b Some other combatant
   * @returns {number} The sort for an {@link Array#sort} callback
   * @protected
   * @override
   */
  _sortCombatants(a, b) {
    let dc = 0;
    // Sort by Players then Neutrals then Hostiles
    if (game.settings.get(systemID, "initiativeMode") === "default") dc = b.disposition - a.disposition;
    if (dc !== 0) return dc;
    return super._sortCombatants(a, b);
  }
}
