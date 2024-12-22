/**
 * A data model used by default effects with properties to control the expiration behavior
 */
export default class BaseEffectModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({
    type: "base"
  });

  /** @override */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Effect.base"];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const config = ds.CONFIG;
    return {
      end: new fields.StringField({choices: Object.keys(config.effectEnds), blank: true, required: true})
    };
  }

  /**
   * An effect is also temporary if it has the `end` property set even though they have indeterminate lengths
   * @returns {true | null}
   */
  get _isTemporary() {
    if (this.end) return true;
    else return null;
  }

  /**
   * Returns the duration label appropriate to this model's `end` property
   * @returns {string}
   */
  get durationLabel() {
    return ds.CONFIG.effectEnds[this.end]?.abbreviation ?? "";
  }

  /** @import {ActiveEffectDuration, EffectDurationData} from "./_types" */

  /**
   * Subtype specific duration calculations
   * @returns {Omit<ActiveEffectDuration, keyof EffectDurationData> | null}
   * @internal
   */
  get _prepareDuration() {
    if (!this.end) return null;
    return {
      type: "draw-steel",
      duration: null,
      remaining: null,
      label: this.durationLabel
    };
  }
}
