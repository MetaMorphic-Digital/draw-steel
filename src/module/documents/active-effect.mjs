import TargetedConditionPrompt from "../applications/apps/targeted-condition-prompt.mjs";

/**
 * @import { StatusEffectConfig } from "@client/config.mjs";
 * @import { DrawSteelActor, DrawSteelCombat, DrawSteelCombatant } from "./_module.mjs";
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

  /**
   * Prefer falsy fall through to expired rather than null coalescing; expiration can always suppress an AE.
   * @inheritdoc
   */
  get isSuppressed() {
    return this.system.isSuppressed || this.duration.expired;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  isExpiryEvent(event, context) {
    const dsEvents = new Set("save", "respite");
    if (!dsEvents.has(event) || !dsEvents.has(this.duration.expiry)) return super.isExpiryEvent(event, context);

    if (event === "save") {
      // copies core combat duration logic
      /** @type {DrawSteelCombat|null} */
      const combat = context.combat ?? game.combat;
      /** @type {DrawSteelCombatant|null|undefined} */
      const effectCombatant = combat?.started
        ? combat === this.start.combat
          ? combat.combatants.get(this.start.combatant)
          : combat.getCombatantsByActor(this.actor ?? "")[0]
        : null;
      return !!effectCombatant;
    }
    // respite
    else return context.actors?.includes(this.target);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static getEffectStart(combat = game.combat) {
    if (!game.combats.isDefaultInitiativeMode) return super.getEffectStart(combat);
    // In normal Draw Steel initiative, almost all abilities have a duration tied to the *target* rather than the *source* of an effect.
    // It is therefore the responsibility of whatever is setting the duration to provide the correct combatant & turn.
    if (!combat?.started) combat = null;
    return {
      time: game.time.worldTime,
      combat: combat?.id ?? null,
      combatant: null,
      initiative: null,
      round: combat?.round ?? null,
      turn: null,
    };
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
      const formattedConditions = formatter.format(immuneList.map(id => _loc(ds.CONFIG.conditions[id]?.name ?? id)));

      ui.notifications.warn("DRAW_STEEL.ActiveEffect.ImmunityWarning", { localize: true, format: { conditions: formattedConditions } });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static applyChange(targetDoc, change, options = {}) {
    if (typeof change.effect?.system.apply === "function")
      return change.effect.system.apply(targetDoc, change, options);
    return super.applyChange(targetDoc, change, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _applyChangeUnguided(targetDoc, change, changes, options = {}) {
    if (!change.key || !(change.key.startsWith?.("flags."))) return;
    super._applyChangeUnguided(targetDoc, change, changes, options);
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
        effectData.system ??= {};
        effectData.system.changes = this.system?.changes ?? [];
        effectData.system.changes.push({
          key: `system.statuses.${statusId}.sources`,
          type: "add",
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
    if (!this.origin) return _loc("COMMON.None");
    let name;
    try {
      // Only difference from core is use of relative-to-target
      name = foundry.utils.fromUuidSync(this.origin, { relative: this.target })?.name;
    } catch (e) { /* empty */ }
    return name || _loc("COMMON.Unknown");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
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

  /* -------------------------------------------- */
  /*  Deprecations and Compatibility              */
  /* -------------------------------------------- */

  /**
   * Keys that need migration in active effects.
   * @type {Record<string, string>}
   */
  static keyMigrations = {
    // 1.0
    "forced.pull": "forced.bonuses.pull",
    "forced.push": "forced.bonuses.push",
    "forced.slide": "forced.bonuses.slide",
    // 0.11
    "hero.skills": "skills.value",
    "hero.skillModifiers": "skills.modifiers",
    // 0.10
    "monster.ev": "ev",
  };

  /** @inheritdoc */
  static migrateData(data) {
    let migrateChanges = false;
    for (const change of data.system?.changes ?? []) {
      for (const [oldPath, newPath] of Object.entries(this.keyMigrations)) {
        const oldKey = change.key;
        change.key = change.key.replace(oldPath, newPath);
        if (change.key !== oldKey) migrateChanges ||= true;
      }
    }

    if (migrateChanges) foundry.utils.setProperty(data, "flags.draw-steel.migrateChanges", true);

    const oldExpiry = "system.end.type";
    const newExpiry = "duration.expiry";
    // only works for *freshly* created documents, existing ones are server migrated and get skipped
    foundry.abstract.Document._addDataFieldMigration(data, oldExpiry, newExpiry, data => {
      const oldValue = foundry.utils.getProperty(data, oldExpiry);
      return ds.CONFIG.effectEnds[oldValue]?.expiryEvent ?? "";
    });

    // Server migrated
    if (foundry.utils.hasProperty(data, oldExpiry) && (data.duration?.expiry === null)) {
      foundry.utils.setProperty(data, "flags.draw-steel.oldExpiry", data.system.end.type);
    }

    return super.migrateData(data);
  }
}
