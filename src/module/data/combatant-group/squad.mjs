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
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    this.refreshTokens();
  }
}
