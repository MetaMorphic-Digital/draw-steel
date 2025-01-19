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
    const isAffectedBySource = !!affected.system.statuses?.[statusId]?.sources.has(source.uuid);
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

  /** @override */
  apply(actor, change) {
    // If there's a change to the slowed speed, and the property does not exist, set it to the default slowed speed. This allows for upgrade/downgrade to apply.
    const path = "system.statuses.slowed.speed";
    if ((change.key === path) && foundry.utils.getProperty(actor, path))
      foundry.utils.setProperty(actor, path, ds.CONFIG.conditions.slowed.defaultSpeed);

    return super.apply(actor, change);
  }

  /** @override */
  _applyAdd(actor, change, current, delta, changes) {
    // If the change is setting a condition source and it doesn't exist on the actor, set the current value to an empty array.
    // If it does exist, convert the Set to an Array.
    const match = change.key.match(/^system\.statuses\.(?<condition>[a-z]+)\.sources$/);
    const condition = match?.groups.condition;
    const config = ds.CONFIG.conditions[condition];
    if (config) {
      if (current) current = Array.from(current);
      else if (!current) current = [];
    }

    // Have the base class apply the changes
    super._applyAdd(actor, change, current, delta, changes);

    // If we're modifying a condition source, slice the array to the max length if applicable, then convert back to Set
    if (config) {
      if (config.maxSources) changes[change.key] = changes[change.key].slice(-config.maxSources);
      changes[change.key] = new Set(changes[change.key]);
    }
  }

  /** @override */
  _applyOverride(actor, change, current, delta, changes) {
    // If the property is a condition, convert the delta to a Set
    const match = change.key.match(/^system\.statuses\.(?<condition>[a-z]+)\.sources$/);
    const condition = match?.groups.condition;
    const config = ds.CONFIG.conditions[condition];
    if (config) delta = new Set([delta]);

    super._applyOverride(actor, change, current, delta, changes);
  }

  /**
   * TODO: REMOVE IN V13
   * Fix bug where _applyUpgrade can set value to undefined
   * @override
   */
  _applyUpgrade(actor, change, current, delta, changes) {
    let update = current;
    const ct = foundry.utils.getType(current);
    switch (ct) {
      case "boolean":
      case "number":
        if ((change.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE) && (delta > current)) update = delta;
        else if ((change.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE) && (delta < current)) update = delta;
        break;
    }
    changes[change.key] = update;
  }
}
