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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  showUse(formData) {
    const actor = this.document.parent;
    if (!actor || (actor.type !== "hero")) return false;
    return actor.system.hero.primary.value < 0;
  }
}
