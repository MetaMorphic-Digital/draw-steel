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
   * Determine if the affected actor has the status and if the source is the one imposing it
   * @param {DrawSteelActor} affected The actor affected by the status
   * @param {DrawSteelActor} source The actor imposing the status
   * @param {string} statusId A status id from the CONFIG object
   * @returns {boolean | null}
   */
  static isStatusSource(affected, source, statusId) {
    if (!affected.statuses.has(statusId)) return null;

    return !!affected.system.statuses?.[statusId]?.sources.has(source.uuid);
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

  /** @override */
  _applyAdd(actor, change, current, delta, changes) {
    // If the change is setting a condition source and it doesn't exist on the actor, set the current value to an empty array.
    // If it does exist, convert the Set to an Array.
    const match = change.key.match(/^system\.statuses\.(?<condition>[a-z]+)\.sources$/);
    const condition = match?.groups.condition;
    const config = CONFIG.statusEffects.find(e => e.id === condition);
    if (config) {
      if (current) current = Array.from(current);
      else if (!current) current = [];
    }

    // If the type is Set, add to it, otherwise have the base class apply the changes
    if (foundry.utils.getType(current) === "Set") current.add(delta);
    else super._applyAdd(actor, change, current, delta, changes);

    // If we're modifying a condition source, slice the array to the max length if applicable, then convert back to Set
    if (config) {
      if (config.maxSources) changes[change.key] = changes[change.key].slice(-config.maxSources);
      changes[change.key] = new Set(changes[change.key]);
    }
  }

  /** @override */
  _applyOverride(actor, change, current, delta, changes) {
    // If the property is a condition or a Set, convert the delta to a Set
    const match = change.key.match(/^system\.statuses\.(?<condition>[a-z]+)\.sources$/);
    const condition = match?.groups.condition;
    const config = CONFIG.statusEffects.find(e => e.id === condition);
    const isSetChange = (foundry.utils.getType(current) === "Set") || config;
    if (isSetChange) delta = new Set([delta]);

    super._applyOverride(actor, change, current, delta, changes);
  }
}
