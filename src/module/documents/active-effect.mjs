import {TargetedConditionPrompt} from "../apps/targeted-condition-prompt.mjs";
import {DrawSteelActor} from "./actor.mjs";

export class DrawSteelActiveEffect extends ActiveEffect {
  /** @override */
  static async _fromStatusEffect(statusId, effectData, options) {
    if (effectData.rule) effectData.description = `@Embed[${effectData.rule} inline]`;
    if (ds.CONFIG.conditions[statusId]?.targeted) await this.targetedConditionPrompt(statusId, effectData);

    const effect = await super._fromStatusEffect(statusId, effectData, options);
    return effect;
  }

  /**
   * Modify the effectData for the new effect with the changes to include the imposing actor's UUID in the appropriate flag.
   * @param {string} statusId
   * @param {object} effectData
   */
  static async targetedConditionPrompt(statusId, effectData) {
    try {
      let imposingActorUuid = await TargetedConditionPrompt.prompt({context: {statusId}});

      if (foundry.utils.parseUuid(imposingActorUuid)) {
        effectData.changes = this.changes ?? [];
        effectData.changes.push({
          key: `system.statuses.${statusId}.sources`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: imposingActorUuid
        });
      }
    } catch (error) {
      ui.notifications.warn("DRAW_STEEL.Effect.TargetedConditionPrompt.Warning", {localize: true});
    }
  }

  /**
   * Determine if a source actor is imposing the statusId on the affected actor.
   * @param {DrawSteelActor} affected The actor affected by the status
   * @param {DrawSteelActor} source The actor imposing the status
   * @param {string} statusId
   * @returns {boolean}
   */
  static isStatusSource(affected, source, statusId) {
    const isAffectedByStatusId = affected.statuses.has(statusId);
    const isAffectedBySource = !!affected.system.statuses[statusId]?.sources.includes(source.uuid);
    return isAffectedByStatusId && isAffectedBySource;
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
