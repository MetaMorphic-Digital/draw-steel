import {TargetedConditionPrompt} from "../apps/targeted-condition-prompt.mjs";
import {systemID} from "../constants.mjs";

export class DrawSteelActiveEffect extends ActiveEffect {
  /** @override */
  static async _fromStatusEffect(statusId, effectData, options) {
    const effect = await super._fromStatusEffect(statusId, effectData, options);
    const sourceData = {};

    if (effectData.rule) sourceData.description = `@Embed[${effectData.rule} inline]`;
    if (ds.CONFIG.conditions[statusId]?.targeted) await this.targetedConditionPrompt(statusId, sourceData);
    
    effect.updateSource(sourceData);
    return effect;
  }

  /**
   * Modify the sourceData for the new effect with the changes to include the imposing actor's UUID in the appropriate flag.
   * @param {string} statusId 
   * @param {object} sourceData
   */
  static async targetedConditionPrompt(statusId, sourceData) {
    try {
      let imposingActorUuid = await TargetedConditionPrompt.prompt({context: {statusId}});
  
      if (foundry.utils.parseUuid(imposingActorUuid)) {
        sourceData.changes = this.changes ?? [];
        sourceData.changes.push({
          key: `flags.${systemID}.${statusId}`,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: imposingActorUuid
        });
      }
    } catch (error) {
      ui.notifications.warn("DRAW_STEEL.Effect.TargetedConditionPrompt.Warning", {localize: true});
    }
  }

  /**
   * Automatically deactivate effects with expired durations
   * @override
   * @type {Boolean}
   */
  get isSuppressed() {
    if (Number.isNumeric(this.duration.remaining)) {
      return this.duration.remaining <= 0;
    }
    return false;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
  }

  /** @import {ActiveEffectDuration, EffectDurationData} from "../data/effect/_types" */

  /**
   * Compute derived data related to active effect duration.
   * @returns {Omit<ActiveEffectDuration, keyof EffectDurationData>}
   * @protected
   * @override
   */
  _prepareDuration() {
    return this.system._prepareDuration ?? super._prepareDuration();
  }

  /**
   * Check if the effect's subtype has special handling, otherwise fallback to normal `duration` and `statuses` check
   * @override
   */
  get isTemporary() {
    return this.system._isTemporary ?? super.isTemporary;
  }
}
