import BaseTraitChoice from "./base-trait-choice.mjs";

export default class SkillChoice extends BaseTraitChoice {
  /** @inheritdoc */
  static get TYPE() {
    return "skill";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return "Skill Choice String";
  }
}
