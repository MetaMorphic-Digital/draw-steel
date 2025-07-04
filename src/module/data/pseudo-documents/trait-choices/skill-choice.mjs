import BaseTraitChoice from "./base-trait-choice.mjs";

export default class SkillChoice extends BaseTraitChoice {
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
    const groupLabel = game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.skillGroup");
    // You can offer a trait choice from a group
    const skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, { label }]) => ({ value, label, group: groupLabel }));

    return skillGroups.concat(ds.CONFIG.skills.optgroups);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  choicesForGroup(group) {
    return Object.entries(ds.CONFIG.skills.list).filter(([, s]) => s.group === group).map(([value]) => (value));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isGroup() {
    return super.isGroup || (this.options in ds.CONFIG.skills.groups);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    if (!this.options) return game.i18n.localize("DRAW_STEEL.TRAIT_CHOICE.Any");
    const config = ds.CONFIG.skills;
    return config.groups[this.options]?.label || config.list[this.options]?.label || game.i18n.localize("Unknown");
  }
}
