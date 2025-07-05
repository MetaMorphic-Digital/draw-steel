import { setOptions } from "../../helpers.mjs";
import TraitAdvancement from "./trait-advancement.mjs";

const { SchemaField, SetField } = foundry.data.fields;

export default class SkillAdvancement extends TraitAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      skills: new SchemaField({
        groups: new SetField(setOptions()),
        choices: new SetField(setOptions()),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "skill";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitChoices() {
    return ds.CONFIG.skills.list;
  }
  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitOptions() {
    const config = ds.CONFIG.skills;
    return Object.entries(config.list).reduce((arr, [value, { label, group }]) => {
      if (this.skills.groups.has(group) || this.skills.choices.has(value)) arr.push({ label, group: config.groups[group].label, value });
      return arr;
    }, []);
  }
}
