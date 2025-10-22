import { setOptions } from "../../helpers.mjs";
import TraitAdvancement from "./trait-advancement.mjs";

const { SetField } = foundry.data.fields;

/**
 * An advancement representing fixed or chosen language(s).
 */
export default class LanguageAdvancement extends TraitAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      languages: new SetField(setOptions()),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "language";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitOptions() {
    const config = ds.CONFIG.languages;
    const any = !this.languages.size;
    return Object.entries(config).reduce((arr, [value, { label }]) => {
      if (any || this.languages.has(value)) arr.push({ label, value });
      return arr;
    }, []);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext() {
    const ctx = {};

    ctx.languageChoices = Object.entries(ds.CONFIG.languages).map(([value, { label }]) => ({ value, label }));
    for (const language of this.languages) {
      if (!(language in ds.CONFIG.languages)) ctx.languageChoices.push({ value: language });
    }

    return ctx;
  }
}
