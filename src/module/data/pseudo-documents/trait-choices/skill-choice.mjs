import BaseTraitChoice from "./base-trait-choice.mjs";

export default class SkillChoice extends BaseTraitChoice {
  /** @inheritdoc */
  static get TYPE() {
    return "skill";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get traitOptions() {
    const groupLabel = game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.skillGroup");
    // You can offer a trait choice from a group
    const skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, { label }]) => ({ value, label, group: groupLabel }));

    return skillGroups.concat(ds.CONFIG.skills.optgroups);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    if (!this.options) return game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.Any");
    const config = ds.CONFIG.skills;
    return config.groups[this.options]?.label || config.list[this.options]?.label || game.i18n.localize("Unknown");
  }
}
