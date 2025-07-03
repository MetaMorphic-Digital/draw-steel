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

    const groupLabel = game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.specificLanguage");

    const options = Object.entries(config).map(([value, { label }]) => ({ label, group: groupLabel, value }), []);

    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    if (!this.options) return game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.Any");
    return ds.CONFIG.languages[this.options]?.label ?? game.i18n.localize("Unknown");
  }
}
