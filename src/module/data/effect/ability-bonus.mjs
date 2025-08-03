import BaseEffectModel from "./base.mjs";
import { setOptions } from "../helpers.mjs";

/**
 * @import DrawSteelActor from "../../documents/actor.mjs";
 */

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

    const fields = foundry.data.fields;

    schema.filters = new fields.SchemaField({
      keywords: new fields.SetField(setOptions()),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Apply this ActiveEffect to all abilities on the actor matching the requirements.
   * @param {DrawSteelActor} actor          The Actor to whom this effect should be applied.
   * @param {EffectChangeData} change       The change data being applied.
   */
  apply(actor, change) {
    change.filters = this.filters;
    actor.system._abilityBonuses.push(change);
    return {};
  }
}
