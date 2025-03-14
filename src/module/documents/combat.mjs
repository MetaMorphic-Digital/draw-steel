import {systemID} from "../constants.mjs";
import {DSRoll} from "../rolls/base.mjs";
/** @import {MaliceModel} from "../data/settings/malice.mjs" */
/** @import {DrawSteelCombatant} from "./combatant.mjs" */

export class DrawSteelCombat extends Combat {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatData", this);
  }

  /**
   * Roll a d10 to determine who goes first. On a 6+, heroes do.
   */
  async rollFirst() {
    const roll = new DSRoll("1d10");
    await roll.evaluate();

    const resultMessage = roll.total >= 6 ? "DRAW_STEEL.Combat.Initiative.Actions.RollFirst.Heroes" : "DRAW_STEEL.Combat.Initiative.Actions.RollFirst.Enemies";

    roll.toMessage({
      flavor: game.i18n.localize(resultMessage)
    }, {rollMode: CONST.DICE_ROLL_MODES.PUBLIC});
  }

  /** @inheritdoc */
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
   * @inheritdoc In Draw Steel's default initiative, non-GM users cannot change the round
   * @param {User} user The user attempting to change the round
   * @returns {boolean} Is the user allowed to change the round?
   */
  _canChangeRound(user) {
    if (game.settings.get(systemID, "initiativeMode") !== "default") return super._canChangeRound(user);
    return user.isGM;
  }

  /** @inheritdoc */
  async nextRound() {
    await super.nextRound();

    if (game.settings.get(systemID, "initiativeMode") !== "default") return;
    const combatantUpdates = this.combatants.map(c => ({_id: c.id, initiative: c.actor?.system.combat.turns ?? 1}));
    this.updateEmbeddedDocuments("Combatant", combatantUpdates);
  }

  /** @inheritdoc */
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
   * @inheritdoc
   */
  _sortCombatants(a, b) {
    let dc = 0;
    // Sort by Players then Neutrals then Hostiles
    if (game.settings.get(systemID, "initiativeMode") === "default") dc = b.disposition - a.disposition;
    if (dc !== 0) return dc;
    return super._sortCombatants(a, b);
  }

  /** @inheritdoc */
  async _onStartRound() {
    /** @type {MaliceModel} */
    const malice = game.settings.get(systemID, "malice");
    const aliveHeroes = this.combatants
      .filter(c => (c.actor?.type === "character") && c.hasPlayerOwner && !c.actor.statuses.has("dead"))
      .map(c => c.actor);
    await malice._onStartRound(this, aliveHeroes);
  }
}
