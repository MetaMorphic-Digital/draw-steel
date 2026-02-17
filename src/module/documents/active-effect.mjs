import TargetedConditionPrompt from "../applications/apps/targeted-condition-prompt.mjs";

/**
 * @import { StatusEffectConfig } from "@client/config.mjs";
 * @import { ActiveEffectDuration, EffectDurationData } from "../data/effect/_types";
 * @import DrawSteelActor from "./actor.mjs";
 */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.ActiveEffect.documentClass.
 */
export default class DrawSteelActiveEffect extends foundry.documents.ActiveEffect {
  /**
   * Checks if a status condition applies to the actor.
   * @param {StatusEffectConfig} status An entry in CONFIG.statusEffects.
   * @param {DrawSteelActor} actor      The actor to check against for rendering.
   * @returns {boolean} Will be shown on the token hud for the actor.
   */
  static validHud(status, actor) {
    return (status.hud !== false) &&
      ((foundry.utils.getType(status.hud) !== "Object") || (status.hud.actorTypes?.includes(actor.type)));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    if (effectData.rule) effectData.description = `@Embed[${effectData.rule} inline]`;
    if (ds.CONFIG.conditions[statusId]?.targeted) await this.targetedConditionPrompt(statusId, effectData);

    const effect = await super._fromStatusEffect(statusId, effectData, options);
    return effect;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Check if actor has immunity to any statuses being applied by this effect
    const immuneList = this.statuses.filter(statusId => this.parent?.system.statuses?.immunities.has(statusId));

    if (immuneList.size) {
      // Warn the user with a list of condition names
      const formatter = game.i18n.getListFormatter({ type: "unit" });
      const formattedConditions = formatter.format(immuneList.map(id => game.i18n.localize(ds.CONFIG.conditions[id]?.name ?? id)));

      ui.notifications.warn("DRAW_STEEL.ActiveEffect.ImmunityWarning", { localize: true, format: { conditions: formattedConditions } });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if ((game.userId === userId) && this.modifiesActor && this.statuses.has("prone")) {
      for (const token of this.target.getDependentTokens()) token.refreshMovementAction();
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if ((game.userId === userId) && this.modifiesActor && this.statuses.has("prone")) {
      for (const token of this.target.getDependentTokens()) token.refreshMovementAction();
    }
  }

  /* -------------------------------------------------- */

  /**
   * Modify the effectData for the new effect with the changes to include the imposing actor's UUID in the appropriate flag.
   * @param {string} statusId
   * @param {object} effectData
   */
  static async targetedConditionPrompt(statusId, effectData) {
    try {
      let imposingActorUuid = await TargetedConditionPrompt.create({ context: { statusId } });

      if (foundry.utils.parseUuid(imposingActorUuid)) {
        effectData.changes = this.changes ?? [];
        effectData.changes.push({
          key: `system.statuses.${statusId}.sources`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: imposingActorUuid,
        });
      }
    } catch (error) {
      ui.notifications.warn("DRAW_STEEL.ActiveEffect.TargetedConditionPrompt.Warning", { localize: true });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Determine if the affected actor has the status and if the source is the one imposing it.
   * @param {DrawSteelActor} affected The actor affected by the status.
   * @param {DrawSteelActor} source The actor imposing the status.
   * @param {string} statusId A status id from the CONFIG object.
   * @returns {boolean | null}
   */
  static isStatusSource(affected, source, statusId) {
    if (!affected?.statuses.has(statusId)) return null;

    return affected.system.statuses?.[statusId]?.sources.has(source.uuid) ?? null;
  }

  /* -------------------------------------------------- */
  /** @inheritdoc */
  get sourceName() {
    if (!this.origin) return game.i18n.localize("None");
    let name;
    try {
      // Only difference from core is use of relative-to-target
      name = foundry.utils.fromUuidSync(this.origin, { relative: this.target })?.name;
    } catch (e) { /* empty */ }
    return name || game.i18n.localize("Unknown");
  }

  /* -------------------------------------------------- */

  /**
   * Automatically deactivate effects with expired durations.
   * @inheritdoc
   */
  get isSuppressed() {
    if (Number.isNumeric(this.duration.remaining)) return this.duration.remaining <= 0;
    // Checks `system.isSuppressed`
    else return super.isSuppressed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Compute derived data related to active effect duration.
   * @returns {Omit<ActiveEffectDuration, keyof EffectDurationData>}
   * @protected
   * @inheritdoc
   */
  _prepareDuration() {
    return this.system._prepareDuration ?? super._prepareDuration();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getDurationLabel(rounds, turns) {
    if ((rounds + turns) !== 0) return super._getDurationLabel(rounds, turns);
    // Lines up with our effect suppression
    return game.i18n.localize("DRAW_STEEL.ActiveEffect.Expired");
  }

  /* -------------------------------------------------- */

  /**
   * Check if the effect's subtype has special handling, otherwise fallback to normal `duration` and `statuses` check.
   * @inheritdoc
   */
  get isTemporary() {
    return this.system._isTemporary ?? super.isTemporary;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyOverride(actor, change, current, delta, changes) {
    // If the property is a condition or a Set, convert the delta to a Set
    const match = change.key.match(/^system\.statuses\.(?<condition>[a-z]+)\.sources$/);
    const condition = match?.groups.condition;
    const config = CONFIG.statusEffects.find(e => e.id === condition);
    const isSetChange = (foundry.utils.getType(current) === "Set") || config;
    if (isSetChange) delta = new Set([delta]);

    super._applyOverride(actor, change, current, delta, changes);
  }

  /* -------------------------------------------------- */

  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * Potentially usable in the future. May also want to adjust details to care about.
   * @returns {object}
   */
  getRollData() {
    // Will naturally have actor data at the base & `item` for any relevant item data
    const rollData = this.parent?.getRollData() ?? {};

    // Shallow copy
    rollData.effect = { ...this.system, duration: this.duration, flags: this.flags, name: this.name, statuses: {} };

    // Statuses provided by *this* active effect
    for (const status of this.statuses) {
      rollData.effect.statuses[status] = 1;
    }

    if (typeof this.system.modifyRollData === "function") {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  apply(actor, change) {
    if (typeof this.system.apply === "function") return this.system.apply(actor, change);
    else return super.apply(actor, change);
  }
}
