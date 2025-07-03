import BaseTraitChoice from "./base-trait-choice.mjs";

export default class LanguageChoice extends BaseTraitChoice {
  /** @inheritdoc */
  static get TYPE() {
    return "language";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return "Language choice string";
  }
}
