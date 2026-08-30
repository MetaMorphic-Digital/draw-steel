import DSRoll from "../rolls/base.mjs";
import SavingThrowManager from "../applications/apps/saving-throw-manager.mjs";

/**
 * @import { MaliceModel } from "../data/settings/malice.mjs";
 * @import { DrawSteelActor, DrawSteelCombatant, DrawSteelCombatantGroup } from "./_module.mjs";
 */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Combat.documentClass.
 */
export default class DrawSteelCombat extends foundry.documents.Combat {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Roll a d10 to determine who goes first. On a 6+, heroes do.
   */
  async rollFirst() {
    const roll = new DSRoll("1d10");
    await roll.evaluate();

    const heroes = this.combatants.filter(c => (c.actor?.type === "hero")).map(c => c.actor);
    const initiativeThreshold = heroes.reduce((threshold, hero) => {
      return (hero.system.combat.initiativeThreshold < threshold) ? hero.system.combat.initiativeThreshold : threshold;
    }, 10);

    const initiativeWinner = roll.total >= initiativeThreshold ? "Heroes" : "Enemies";
    const resultMessage = `DRAW_STEEL.Combat.Initiative.Actions.RollFirst.${initiativeWinner}`;

    roll.toMessage({
      flavor: _loc(resultMessage),
    }, { messageMode: "public" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async startCombat() {
    for (const combatant of this.combatants) {
      await combatant.actor?.system.startCombat(combatant);
    }

    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    const heroes = this.combatants.filter(c => (c.actor?.type === "hero") && c.hasPlayerOwner).map(c => c.actor);
    await malice.startCombat(heroes);

    const combatantGroupUpdates = this.groups.map(c => ({ _id: c.id, initiative: 1 }));
    await this.updateEmbeddedDocuments("CombatantGroup", combatantGroupUpdates);

    return super.startCombat();
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc In Draw Steel's default initiative, non-GM users cannot change the round
   * @param {User} user The user attempting to change the round.
   * @returns {boolean} Is the user allowed to change the round?
   */
  _canChangeRound(user) {
    if (!game.combats.isDefaultInitiativeMode) return super._canChangeRound(user);
    return user.isGM;
  }

  /* -------------------------------------------------- */

  /**
   * End the current turn without starting a new one.
   * @returns {DrawSteelCombat}
   */
  async endTurn() {
    const updateData = { round: this.round, turn: null };
    const updateOptions = { direction: 1, worldTime: { delta: null } };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async nextRound() {
    // In memory adjustment that will get committed during the super call
    if (game.combats.isDefaultInitiativeMode) this.turn = null;
    await super.nextRound();

    if (!game.combats.isDefaultInitiativeMode) return this;
    const combatantUpdates = this.combatants.map(c => ({ _id: c.id, initiative: c.actor?.system.combat.turns ?? 1 }));
    await this.updateEmbeddedDocuments("Combatant", combatantUpdates);
    const combatantGroupUpdates = this.groups.map(c => ({ _id: c.id, initiative: 1 }));
    await this.updateEmbeddedDocuments("CombatantGroup", combatantGroupUpdates);
    return this;
  }

  /* -------------------------------------------------- */

  /**
   * @param {DrawSteelCombatant | DrawSteelCombatantGroup} a Some combatant.
   * @param {DrawSteelCombatant | DrawSteelCombatantGroup} b Some other combatant.
   * @returns {number} The sort for an {@linkcode Array.sort | Array#sort} callback.
   * @protected
   * @inheritdoc
   */
  _sortCombatants(a, b) {
    let dc = 0;
    // Sort by Players then Neutrals then Hostiles
    if (game.combats.isDefaultInitiativeMode) {
      dc = b.disposition - a.disposition;
      if (!dc && a.active) return -1;
      else if (!dc && b.active) return 1;
      if (!dc && (a.group === b.group) && (a.group?.type === "squad")) {
        if (!a.actor?.isMinion) return -1;
        else if (!b.actor?.isMinion) return 1;
      }
    }
    if (dc) return dc;

    const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
    // sort by initiative value, then name, then ID
    return (ib - ia) || a.name?.localeCompare(b.name, game.i18n.lang, { numeric: true }) || (a.id > b.id ? 1 : -1);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    ui.players.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (!game.user.isActiveGM || !this.round) return;

    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    await malice.resetMalice();

    /** If malice is already 0, the {@linkcode MaliceModel.onChange} won't fire at the end of combat to render the player UI. */
    await ui.players.render();

    await this.completeEncounter();
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been created and changes have been applied to client data.
     * @param {DrawSteelCombat} parent         The direct parent of the created Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were created.
     * @param {DrawSteelCombatant[] | DrawSteelCombatantGroup[]} documents    The array of created Documents.
     * @param {object[]} data           The source data for new documents that were created.
     * @param {object} options          Options which modified the creation operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been updated and changes have been applied to client data.
     * @param {DrawSteelCombat} parent         The direct parent of the updated Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were updated.
     * @param {DrawSteelCombatant[] | DrawSteelCombatantGroup[]} documents    The array of updated Documents.
     * @param {object[]} changes        The array of differential Document updates which were applied.
     * @param {object} options          Options which modified the update operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onUpdateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onUpdateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been deleted and those deletions have been applied to client data.
     * @param {Document} parent         The direct parent of the deleted Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were deleted.
     * @param {Document[]} documents    The array of Documents which were deleted.
     * @param {string[]} ids            The array of document IDs which were deleted.
     * @param {object} options          Options which modified the deletion operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
   * Shared actions taken when CombatantGroups are modified within this Combat document.
   * @param {DrawSteelCombat} parent              The direct parent of the created Documents, may be this Document or a child.
   * @param {DrawSteelCombatantGroup[]} documents The array of created Documents.
   * @param {object} options                      Options which modified the operation.
   */
  #onModifyCombatantGroups(parent, documents, options) {
    if ((ui.combat.viewed === parent) && (options.render !== false)) ui.combat.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _manageTurnEvents() {
    if (!this.started) return;
    if (!game.combats.isDefaultInitiativeMode) return super._manageTurnEvents();

    // Capture current and previous states
    const { current, previous } = this;

    // Director handling only
    if (game.user.isActiveGM) await this.#triggerDSTurnEvents();

    // Hooks handled by all clients
    Hooks.callAll("combatTurnChange", this, previous, current);
  }

  /* -------------------------------------------------- */

  /**
   * A Draw Steel alternative to the core #triggerTurnEvents which does not properly handle nonlinear turn orders.
   * The fundamental issue is that the core implementation
   * - does not proc turn events when going in "reverse" order (so monster to hero) because it assumes we're rewinding
   * - *does* proc turn events of "skipped" tokens
   * This is highly undesirable when interacting with the core region triggers.
   * See https://github.com/foundryvtt/foundryvtt/issues/13983 for core ticket.
   */
  async #triggerDSTurnEvents() {
    const { current, previous } = this;

    const previousCombatant = this.combatants.get(previous?.combatantId);

    if (previousCombatant) {
      // end turn
      const context = { round: previous.round, turn: previous.turn, skipped: false };
      if (CONFIG.debug.combat) console.debug(` | Combat End Turn: ${previousCombatant.name}`);
      await this._onEndTurn(previousCombatant, context);
      await foundry.documents.ActiveEffect.registry.refresh("turnEnd", { ...context, combat: this });
      this.#triggerDSRegionEvents(CONST.REGION_EVENTS.TOKEN_TURN_END, context, [previousCombatant]);
    }
    if (current.round !== previous.round) {
      // end round
      if (CONFIG.debug.combat) console.debug(` | Combat End Round: ${previous.round}`);
      await this._onEndRound({ round: previous.round, skipped: false });
      await foundry.documents.ActiveEffect.registry.refresh("roundEnd", { round: previous.round, skipped: false, combat: this });
      this.#triggerDSRegionEvents(CONST.REGION_EVENTS.TOKEN_ROUND_END, { round: previous.round, skipped: false }, this.combatants);
      // start round
      if (CONFIG.debug.combat) console.debug(` | Combat Start Round: ${current.round}`);
      await this._onStartRound({ round: current.round, skipped: false });
      await foundry.documents.ActiveEffect.registry.refresh("roundStart", { round: current.round, skipped: false, combat: this });
      this.#triggerDSRegionEvents(CONST.REGION_EVENTS.TOKEN_ROUND_START, { round: current.round, skipped: false }, this.combatants);
    }
    const currentCombatant = this.combatants.get(current?.combatantId);
    // Do not proc start of turn effects when transitioning rounds since it just goes to the first person
    if (currentCombatant) {
      // start turn
      const context = { round: current.round, turn: current.turn, skipped: false };
      if (CONFIG.debug.combat) console.debug(` | Combat Start Turn: ${currentCombatant.name}`);
      await this._onStartTurn(currentCombatant, context);
      await this._clearMovementHistoryOnStartTurn(currentCombatant, context);
      await foundry.documents.ActiveEffect.registry.refresh("turnStart", { ...context, combat: this });
      this.#triggerDSRegionEvents(CONST.REGION_EVENTS.TOKEN_TURN_START, context, [currentCombatant]);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onExit(combatant) {
    /** @type {DrawSteelActor} */
    const actor = combatant.actor;
    if (!actor) return;
    const combatEvents = new Set("save", "combatEnd", "roundStart", "roundEnd", "turnStart", "turnEnd");
    const toDelete = actor.effects.filter(e => e.duration.expired || (combatEvents.has(e.duration.expiry) && (e._source.start.combat === this.id)));

    // TODO: Consider if we need some notification or message here.

    // Don't need to await
    actor.deleteEmbeddedDocuments("ActiveEffect", toDelete.map(e => e.id));
  }

  /* -------------------------------------------------- */

  /**
   * Handle Saving Throw expiration logic.
   * @inheritdoc
   */
  async _onEndTurn(combatant, context) {
    /** @type {DrawSteelActor} */
    const actor = combatant.actor;
    if (!actor || context.skipped) return;
    for (const effect of actor.appliedEffects) {
      if (effect.duration.expiry === "save") {
        SavingThrowManager.delegateSavingThrow(effect);
      }
    }
    combatant.actor?.system._onEndTurn(combatant);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onStartRound() {
    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    const aliveHeroes = this.combatants
      .filter(c => (c.actor?.type === "hero") && c.hasPlayerOwner && !c.actor.statuses.has("dead"))
      .map(c => c.actor);
    await malice._onStartRound(this, aliveHeroes);
  }

  /* -------------------------------------------------- */

  /**
   * Trigger Region events for Combat events.
   * @param {string} eventName                  The event name.
   * @param {object & {token: never, combatant: never, combat: never}} eventData
   *                                            The event data (without `token`, `combatant`, and `combat`).
   * @param {Iterable<Combatant>} combatants    The combatants to trigger the event for.
   * @returns {Promise<void>}
   */
  async #triggerDSRegionEvents(eventName, eventData, combatants) {
    const promises = [];
    for (const combatant of combatants) {
      const token = combatant.token;
      if (!token) continue;
      for (const region of token.regions) {
        promises.push(region._triggerEvent(eventName, { token, combatant, combat: this, ...eventData }));
      }
    }
    await Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the GM for end of encounter adjustments.
   */
  async completeEncounter() {
    const content = document.createElement("div");

    const victoryGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.AwardVictories.label",
      hint: "DRAW_STEEL.Combat.CompleteEncounter.AwardVictories.hint",
      // TODO: Once encounter difficulty math is implemented, default victory value to the victories for that difficulty
      input: foundry.applications.fields.createNumberInput({ name: "victories", value: 1 }),
      localize: true,
    });

    const resetTempStamina = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.ResetTempStamina.label",
      input: foundry.applications.fields.createCheckboxInput({ name: "resetTempStamina", value: true }),
      classes: ["slim"],
      localize: true,
    });

    const resetHeroicResources = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.ResetHeroicResources.label",
      input: foundry.applications.fields.createCheckboxInput({ name: "resetHeroicResources", value: true }),
      classes: ["slim"],
      localize: true,
    });

    const resetSurgeResources = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.ResetSurgeResources.label",
      input: foundry.applications.fields.createCheckboxInput({ name: "resetSurgeResources", value: true }),
      classes: ["slim"],
      localize: true,
    });

    content.append(victoryGroup, resetTempStamina, resetHeroicResources, resetSurgeResources);
    const fd = await ds.applications.api.DSDialog.input({
      content,
      classes: ["complete-encounter"],
      window: {
        title: "DRAW_STEEL.Combat.CompleteEncounter.Title",
      },
    });

    if (fd) {
      for (const combatant of this.combatants) {
        const actor = combatant.actor;
        if (!actor) continue;
        const updates = { system: { } };
        if (actor.type === "hero") {
          updates.system.hero = { victories: actor.system.hero.victories + fd.victories };
          if (fd.resetHeroicResources) updates.system.hero.primary = { value: 0 };
          if (fd.resetSurgeResources) updates.system.hero.surges = 0;
        }
        if (fd.resetTempStamina) updates.system.stamina = { temporary: 0 };

        await actor.update(updates);
      }
    }
  }
}
