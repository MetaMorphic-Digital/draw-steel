import BaseCombatantGroupModel from "./base.mjs";

/**
 * A squad is a group of up to eight minions that act together.
 */
export default class SquadModel extends BaseCombatantGroupModel {
  /** @override */
  static metadata = Object.freeze({
    type: "squad"
  });
}
