import BaseCombatantGroupModel from "./base.mjs";

/** @import DrawSteelActor from "../../documents/actor.mjs"; */

const fields = foundry.data.fields;

/**
 * A squad is a group of up to eight minions that act together.
 */
export default class SquadModel extends BaseCombatantGroupModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    type: "squad",
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.CombatantGroup.squad",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    return Object.assign(schema, {
      staminaValue: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
    });
  }

  /**
   * Finds the captain
   * @type {DrawSteelActor | null}
   */
  get captain() {
    return this.parent.members.find(c => !c.actor?.isMinion)?.actor ?? null;
  }

  /**
   * Finds all the minions in the squad
   * @type {Set<DrawSteelActor>}
   */
  get minions() {
    return this.parent.members.filter(c => c.actor?.isMinion);
  }

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

  /** @inheritdoc */
  async _preUpdate(changed, options, userId) {
    const allowed = await super._preUpdate(changed, options, userId);
    if (allowed === false) return false;

    if (changed.system?.staminaValue) {
      options.ds ??= {};
      options.ds.staminaDiff = this.staminaValue - changed.system.staminaValue;
    }
  }

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    console.log(options);

    if (changed.system && ("staminaValue" in changed.system)) this.refreshSquad();
    if (options.ds?.staminaDiff) this.displayMinionStaminaChange(options.ds.staminaDiff);
  }

  displayMinionStaminaChange(diff) {
    this.minions.forEach((minion) => {
      minion.actor?.system.displayStaminaChange(diff);
    });
  }

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    this.refreshSquad();
  }
}
