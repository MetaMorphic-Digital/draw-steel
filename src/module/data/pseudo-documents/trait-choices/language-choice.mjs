import BaseTraitChoice from "./base-trait-choice.mjs";

export default class LanguageChoice extends BaseTraitChoice {
  /** @inheritdoc */
  static get TYPE() {
    return "language";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitOptions() {
    const config = ds.CONFIG.languages;

    const options = Object.entries(config).map((value, { label }) => ({ label, group: "Individuali18n", value }), []);

    options.push({ value: "all", label: "Any Language" });

    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return "Language choice string";
  }
}
