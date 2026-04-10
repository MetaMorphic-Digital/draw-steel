import BaseCombatantGroupModel from "./base.mjs";
import { DrawSteelActor } from "../../documents/_module.mjs";
import DrawSteelCombatant from "../../documents/combatant.mjs";

const fields = foundry.data.fields;

/**
 * A squad is a group of up to eight minions that act together.
 */
export default class SquadModel extends BaseCombatantGroupModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      // no-op but future proofing for additions to the BaseCombatantGroupModel
      ...super.metadata,
      type: "squad",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.CombatantGroup.squad"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    return Object.assign(schema, {
      staminaValue: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      captainId: new fields.ForeignDocumentField(DrawSteelCombatant, { idOnly: true }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Finds the captain.
   * @type {DrawSteelCombatant | null}
   */
  get captain() {
    const combatant = this.combat.combatants.get(this.captainId);
    // Make sure combatant exists in the combat and is still a part of this squad.
    if (!combatant || (combatant.group?.id !== this.parent.id)) return null;

    return combatant;
  }

  /* -------------------------------------------------- */

  /**
   * Finds all the minions in the squad.
   * @type {Set<DrawSteelCombatant>}
   */
  get minions() {
    return this.parent.members.filter(c => c.actor?.isMinion);
  }

  /* -------------------------------------------------- */

  /**
   * The max stamina for the minions in this squad.
   * Implemented as a getter for data prep order reasons.
   * @type {number}
   */
  get staminaMax() {
    return this.parent.members.reduce((maxStam, c) => {
      if (c.actor?.isMinion) maxStam += foundry.utils.getProperty(c, "actor.system.stamina.max") ?? 0;
      return maxStam;
    }, 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changed, options, userId) {
    const allowed = await super._preUpdate(changed, options, userId);
    if (allowed === false) return false;

    if (changed.system?.staminaValue) {
      options.ds ??= {};
      options.ds.staminaDiff = this.staminaValue - changed.system.staminaValue;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (changed.system && ("staminaValue" in changed.system)) {
      this.refreshSquad();
      this.checkDefeatedMinions();
    }
    if (options.ds?.staminaDiff) this.displayMinionStaminaChange(options.ds.staminaDiff, options.ds.damageType);
  }

  /* -------------------------------------------------- */

  /**
   * Displays a change in stamina over each minion in a group.
   *
   * @param {number} diff The amount of stamina that has changed.
   * @param {string} [damageType=""] The type of damage being dealt.
   */
  displayMinionStaminaChange(diff, damageType = "") {
    this.minions.forEach((minion) => {
      minion.actor?.system.displayStaminaChange(diff, damageType);
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    this.refreshSquad();
  }

  /* -------------------------------------------------- */

  /**
   * Determine if any minions should be defeated based on stamina value and threshold and prompt the active owner to mark them as defeated.
   */
  async checkDefeatedMinions() {
    const minions = this.minions;
    if (!minions.size) return;

    const activePlayerOwner = game.users.find(user => !user.isGM && user.active && this.parent.testUserPermission(user, "OWNER") && minions.every(minion => minion.testUserPermission(user, "OWNER")));
    const promptedUser = activePlayerOwner ?? game.users.activeGM;
    if (!promptedUser?.isSelf) return;

    const { defeated = [], undefeated = [] } = Object.groupBy(minions, minion => minion.defeated ? "defeated" : "undefeated");
    const staminaPerMinion = foundry.utils.getProperty(minions.first().actor, "system.stamina.max") ?? 0;
    const shouldBeDefeated = Math.clamp(minions.size - Math.ceil(this.staminaValue / staminaPerMinion), 0, minions.size);
    const needToDefeat = shouldBeDefeated - defeated.length;
    // Only prompt if the number of minions that need to be defeated exceeds 0.
    if (needToDefeat <= 0) return;

    const fd = await ds.applications.apps.DefeatedMinionSelection.create({ context: { undefeated, needToDefeat, combat: this.combat, squad: this.parent } });
    if (!fd || !fd.selectedMinions.length) return;

    const selectedMinions = fd.selectedMinions.map(id => this.combat.combatants.get(id));
    const combatantUpdates = [];
    for (const minion of selectedMinions) {
      combatantUpdates.push({ _id: minion.id, defeated: true });
      await minion.actor?.toggleStatusEffect(CONFIG.specialStatusEffects.DEFEATED, { overlay: true, active: true });
    }
    await this.combat.updateEmbeddedDocuments("Combatant", combatantUpdates);
  }

  /* -------------------------------------------------- */

  /**
   * Deal damage to the squad, accounting for immunities and resistances which are applied only once per squad.
   * @param {Array<DrawSteelActor>} minions    The minions that are taking the damage.
   * @param {number} damagePerMinion           The amount of damage to take.
   * @param {object} [options]                 Options to modify the damage application.
   * @param {string} [options.type]            Valid damage type.
   * @param {boolean} [options.aoe]            Is this an AOE that should have the damage capped?
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore.
   * @returns {Promise<DrawSteelCombatantGroup>}
   */
  async takeDamage(minions, damagePerMinion, options = {}) {
    if (!minions.length) return this;

    // Get all minions immunities and weaknesses and reduce it to the highest ones.
    const applicableImmunityWeakness = { immunity: 0, weakness: 0 };
    for (const minion of minions) {
      const { immunity = 0, weakness = 0 } = minion.system.calculateImmunityAndWeakness(options);
      applicableImmunityWeakness.immunity = Math.max(immunity, applicableImmunityWeakness.immunity);
      applicableImmunityWeakness.weakness = Math.max(weakness, applicableImmunityWeakness.weakness);
    }

    if (options.aoe) damagePerMinion = Math.min(damagePerMinion, minions[0].system.stamina.max);
    const damage = Math.max(0, (damagePerMinion * minions.length) + applicableImmunityWeakness.weakness - applicableImmunityWeakness.immunity);

    return this.parent.update({ "system.staminaValue": this.staminaValue - damage }, { ds: { damageType: options.type } });
  }
}
