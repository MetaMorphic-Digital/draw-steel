import BaseSpecialEffect from "./base-special-effect.mjs";

/**
 * Strained effects are used by the Talent.
 */
export default class StrainedSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "strained";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get label() {
    return _loc("TYPES.SpecialEffect.strained");
  }
}
