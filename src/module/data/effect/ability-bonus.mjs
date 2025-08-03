import BaseEffectModel from "./base.mjs";

/**
 * An Active Effect subtype that represents bonuses to an actor's abilities.
 */
export default class AbilityBonus extends BaseEffectModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      type: "abilityBonus",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ActiveEffect.abilityBonus");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    return schema;
  }
}
