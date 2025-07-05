import { setOptions } from "../../helpers.mjs";
import TraitAdvancement from "./trait-advancement.mjs";

const { SetField } = foundry.data.fields;

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
  get traitChoices() {
    return ds.CONFIG.languages;
  }
  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitOptions() {
    const config = ds.CONFIG.languages;
    return Object.entries(config).reduce((arr, [value, { label }]) => {
      if (this.any || this.languages.has(value)) arr.push({ label, value });
      return arr;
    }, []);
  }
}
