import { setOptions } from "../../helpers.mjs";
import TraitAdvancement from "./trait-advancement.mjs";

const { SchemaField, SetField } = foundry.data.fields;

/**
 * An advancement representing fixed or chosen skill(s).
 */
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
  get traitOptions() {
    const config = ds.CONFIG.skills;
    const any = !this.skills.groups.size && !this.skills.choices.size;
    return Object.entries(config.list).reduce((arr, [value, { label, group }]) => {
      if (any || this.skills.groups.has(group) || this.skills.choices.has(value)) arr.push({ label, group: config.groups[group].label, value });
      return arr;
    }, []);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(options) {
    const ctx = {};

    ctx.skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, { label }]) => ({ value, label }));
    for (const group of this.skills.groups) {
      if (!(group in ds.CONFIG.skills.groups)) ctx.skillGroups.push({ value: group });
    }

    ctx.skillChoices = ds.CONFIG.skills.optgroups;
    for (const skill of this.skills.choices) {
      if (!(skill in ds.CONFIG.skills.list)) ctx.skillChoices.push({ value: skill });
    }

    return ctx;
  }
}
