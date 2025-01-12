import {systemID} from "../constants.mjs";
/** @import {MaliceModel} from "../data/settings/malice.mjs" */
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
      await combatant.actor?.system.startCombat(combatant);
    }

    /** @type {MaliceModel} */
    const malice = game.settings.get(systemID, "malice");
    const heroes = this.combatants.filter(c => (c.actor?.type === "character") && c.hasPlayerOwner).map(c => c.actor);
    await malice.startCombat(heroes);

    return super.startCombat();
  }

  /**
   * @override In Draw Steel's default initiative, non-GM users cannot change the round
   * @param {User} user The user attempting to change the round
   * @returns {boolean} Is the user allowed to change the round?
   */
  _canChangeRound(user) {
    if (game.settings.get(systemID, "initiativeMode") !== "default") return super._canChangeRound(user);
    return user.isGM;
  }

  /** @override */
  async nextRound() {
    await super.nextRound();

    // Only GM users can update world settings
    if (game.user.isGM) {
      /** @type {MaliceModel} */
      const malice = game.settings.get(systemID, "malice");
      const aliveHeroes = this.combatants
        .filter(c => (c.actor?.type === "character") && c.hasPlayerOwner && !c.actor.statuses.has("dead"))
        .map(c => c.actor);
      await malice.nextRound(this, aliveHeroes);
    }

    if (game.settings.get(systemID, "initiativeMode") !== "default") return;
    const combatantUpdates = this.combatants.map(c => ({_id: c.id, initiative: c.actor?.system.combat.turns ?? 1}));
    this.updateEmbeddedDocuments("Combatant", combatantUpdates);
  }

  /** @override */
  async endCombat() {
    const deletedCombat = await super.endCombat();

    if (deletedCombat) {
      /** @type {MaliceModel} */
      const malice = game.settings.get(systemID, "malice");
      await malice.endCombat();
    }

    return deletedCombat;
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
