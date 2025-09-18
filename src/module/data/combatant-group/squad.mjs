import BaseCombatantGroupModel from "./base.mjs";
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

    if (changed.system && ("staminaValue" in changed.system)) this.refreshSquad();
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
}
