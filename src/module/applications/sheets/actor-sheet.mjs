import { AbilityModel, FeatureModel } from "../../data/item/_module.mjs";
import { DrawSteelActiveEffect, DrawSteelChatMessage, DrawSteelItem } from "../../documents/_module.mjs";
import DrawSteelItemSheet from "./item-sheet.mjs";
import DSDocumentSheetMixin from "../api/document-sheet-mixin.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import ActorCombatStatsInput from "../apps/actor-combat-stats-input.mjs";

/**
 * @import { NumberField } from "@common/data/fields.mjs";
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 * @import { ActiveEffectCategory, ActorSheetItemContext, ActorSheetAbilitiesContext } from "./_types.js";
 */

const { sheets } = foundry.applications;

/**
 * AppV2-based sheet for all actor classes.
 */
export default class DrawSteelActorSheet extends DSDocumentSheetMixin(sheets.ActorSheetV2) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["actor"],
    position: {
      width: 700,
      height: 600,
    },
    actions: {
      toggleMode: this.#toggleMode,
      viewDoc: this.#viewDoc,
      createDoc: this.#createDoc,
      deleteDoc: this.#deleteDoc,
      toggleStatus: this.#toggleStatus,
      toggleEffect: this.#toggleEffect,
      roll: this.#onRoll,
      editCombat: this.#editCombat,
      useAbility: this.#useAbility,
      toggleItemEmbed: this.#toggleItemEmbed,
      toggleEffectDescription: this.#toggleEffectDescription,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "stats" },
        { id: "features" },
        { id: "equipment" },
        { id: "projects" },
        { id: "abilities" },
        { id: "effects" },
        { id: "biography" },
      ],
      initial: "stats",
      labelPrefix: "DRAW_STEEL.Actor.Tabs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * A set of the currently expanded item ids.
   * @type {Set<string>}
   */
  #expanded = new Set();

  /* -------------------------------------------------- */

  /**
   * A set of the currently expanded effect UUIDs.
   * @type {Set<string>}
   */
  #expandedDescriptions = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    if (this.document.limited) {
      const { header, tabs, biography } = parts;
      return { header, tabs, biography };
    }

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      datasets: this._getDatasets(),
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);

    if (group === "primary") {
      if (this.document.limited) {
        tabs.biography.active = true;
        tabs.biography.cssClass = "active";
        return { biography: tabs.biography };
      }

      if (this.document.type !== "hero") {
        delete tabs.equipment;
        delete tabs.projects;
      }
    }

    return tabs;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "stats":
        context.characteristics = this._getCharacteristics();
        context.combatTooltip = this._getCombatTooltip();
        context.movement = this._getMovement();
        context.damageIW = this._getImmunitiesWeaknesses();
        break;
      case "features":
        context.features = await this._prepareFeaturesContext();
        context.featureFields = FeatureModel.schema.fields;
        break;
      case "abilities":
        context.abilities = await this._prepareAbilitiesContext();
        context.abilityFields = AbilityModel.schema.fields;
        break;
      case "biography":
        context.languages = this._getLanguages();
        context.enrichedBiography = await enrichHTML(this.actor.system.biography.value, { relativeTo: this.actor });
        context.enrichedDirectorNotes = await enrichHTML(this.actor.system.biography.director, { relativeTo: this.actor });
        break;
      case "effects":
        context.statuses = await this._prepareStatusEffects();
        context.effects = await this._prepareActiveEffectCategories();
        break;
    }
    if (partId in context.tabs) context.tab = context.tabs[partId];
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Constructs a record of valid characteristics and their associated field.
   * @returns {Record<string, {field: NumberField, value: number}>}
   * @protected
   */
  _getCharacteristics() {
    const isPlay = this.isPlayMode;
    const data = isPlay ? this.actor : this.actor._source;
    return Object.keys(ds.CONFIG.characteristics).reduce((obj, chc) => {
      const value = foundry.utils.getProperty(data, `system.characteristics.${chc}.value`);
      obj[chc] = {
        field: this.actor.system.schema.getField(["characteristics", chc, "value"]),
        value: isPlay ? (value ?? 0) : (value || null),
      };
      return obj;
    }, {});
  }

  /* -------------------------------------------------- */

  /**
   * Constructs a tooltip of data paths.
   * @protected
   */
  _getCombatTooltip() {
    const dataPaths = ["turns", "save.bonus", "save.threshold"];
    let tooltip = "";
    for (const p of dataPaths) {
      const current = foundry.utils.getProperty(this.actor.system.combat, p);
      const field = this.actor.system.schema.fields.combat.getField(p);
      if (current !== field.getInitialValue()) {
        tooltip += `<p>${field.label}: ${current}</p>`;
      }
    }
    return tooltip;
  }

  /* -------------------------------------------------- */

  /**
   * Constructs an object with the actor's movement types as well as all options available from CONFIG.Token.movement.actions.
   * @returns {{flying: boolean, list: string, options: FormSelectOption[]}}
   * @protected
   */
  _getMovement() {
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const actorMovement = this.actor.system.movement;
    const canHover = actorMovement.types.has("fly") || actorMovement.types.has("teleport");
    const movementList = Array.from(actorMovement.types).map(m => {
      let label = game.i18n.localize(CONFIG.Token.movement.actions[m]?.label ?? m);
      if ((m === "teleport") && (actorMovement.teleport !== actorMovement.value)) label += " " + actorMovement.teleport;
      return label;
    });
    if (canHover && actorMovement.hover) movementList.push(game.i18n.localize("DRAW_STEEL.Actor.base.FIELDS.movement.hover.label"));
    return {
      canHover,
      list: formatter.format(movementList),
      options: Object.entries(CONFIG.Token.movement.actions)
        .filter(([key, _action]) => ds.CONFIG.speedOptions.includes(key))
        .map(([value, { label }]) => ({ value, label })),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Constructs an object with the actor's languages as well as all options available from CONFIG.DRAW_STEEL.languages.
   * @returns {{list: string, options: FormSelectOption[]}}
   * @protected
   */
  _getLanguages() {
    if (!this.actor.system.schema.getField("biography.languages")) return { list: "", options: [] };
    const formatter = game.i18n.getListFormatter();
    const languageList = Array.from(this.actor.system.biography.languages).map(l => ds.CONFIG.languages[l]?.label ?? l);
    return {
      list: formatter.format(languageList),
      options: Object.entries(ds.CONFIG.languages).map(([value, { label }]) => ({ value, label })),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Constructs an object with the formatted immunities and weaknesses with a list of damage labels.
   * @returns {{immunities: string, weaknesses: string, labels: Record<string, string>}}
   * @protected
   */
  _getImmunitiesWeaknesses() {
    const labels = {
      all: game.i18n.localize("DRAW_STEEL.Actor.base.FIELDS.damage.immunities.all.label"),
      ...Object.entries(ds.CONFIG.damageTypes).reduce((acc, [type, { label }]) => {
        acc[type] = label;
        return acc;
      }, {}),
    };

    const immunities = Object.entries(this.actor.system.damage.immunities).filter(([damageType, value]) => value > 0).map(([damageType, value]) => `<span class="immunity">${labels[damageType]} ${value}</span>`);
    const weaknesses = Object.entries(this.actor.system.damage.weaknesses).filter(([damageType, value]) => value > 0).map(([damageType, value]) => `<span class="weakness">${labels[damageType]} ${value}</span>`);

    const formatter = game.i18n.getListFormatter({ type: "unit" });
    return {
      immunities: formatter.format(immunities),
      weaknesses: formatter.format(weaknesses),
      labels,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Helper to compose datasets available in the hbs.
   * @returns {Record<string, unknown>}
   * @protected
   */
  _getDatasets() {
    return {
      isSource: { source: true },
      notSource: { source: false },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Generate the context data shared between item types.
   * @param {DrawSteelItem} item
   * @returns {Promise<ActorSheetItemContext>}
   */
  async _prepareItemContext(item) {
    const context = {
      item,
      expanded: this.#expanded.has(item.id),
    };

    // only generate the item embed when it's expanded
    if (context.expanded) context.embed = await item.system.toEmbed({ includeName: false });

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for features.
   * @returns {Array<ActorSheetItemContext>}
   * @protected
   */
  async _prepareFeaturesContext() {
    const features = this.actor.itemTypes.feature.toSorted((a, b) => a.sort - b.sort);
    const context = [];

    for (const feature of features) {
      context.push(await this._prepareItemContext(feature));
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the context for ability categories and individual abilities.
   * @protected
   */
  async _prepareAbilitiesContext() {
    /**
     * @type {Record<string, ActorSheetAbilitiesContext>}
     */
    const context = {};
    const abilities = this.actor.itemTypes.ability.toSorted((a, b) => a.sort - b.sort);

    // Prepare ability categories for each ability type
    for (const [type, config] of Object.entries(ds.CONFIG.abilities.types)) {
      // Don't show villain actions on non-NPC sheets
      if ((type === "villain") && (this.actor.type !== "npc")) continue;

      context[type] = {
        label: config.label,
        abilities: [],
        showHeader: true,
        showAdd: this.isEditMode,
      };
    }

    // Adding here instead of the initial context declaration so that the "other" category appears last on the character sheet
    context["other"] = {
      label: game.i18n.localize("DRAW_STEEL.SHEET.Other"),
      abilities: [],
      showAdd: false,
      // Show "other" if and only if there are abilities of that type
      showHeader: false,
    };

    // Prepare the context for each individual ability
    for (const ability of abilities) {
      const type = context[ability.system.type] ? ability.system.type : "other";

      const abilityContext = await this._prepareItemContext(ability);
      abilityContext.formattedLabels = ability.system.formattedLabels;

      // add the order to the villain action based on the current # of villain actions in the context
      if (type === "villain") {
        const villainActionCount = context[type].abilities.length;
        abilityContext.order = villainActionCount + 1;
      }
      context[type].showHeader = true;

      context[type].abilities.push(abilityContext);
    }

    // Filter out unused headers for play mode
    if (this.isPlayMode) {
      for (const [key, value] of Object.entries(context)) {
        if (!value.abilities.length) delete context[key];
      }
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * @typedef StatusInfo
   * @property {string} _id
   * @property {string} name
   * @property {string} img
   * @property {boolean} disabled
   * @property {"active" | ""} active
   * @property {string} [tooltip]
   */

  /**
   * Prepare the data structure for status effects and whether they are active.
   * @protected
   */
  async _prepareStatusEffects() {
    /** @type {Record<string, StatusInfo>} */
    const statusInfo = {};
    for (const status of CONFIG.statusEffects) {
      // Only display if it would show in the token HUD *and* it has an assigned _id
      if ((!status._id) || !DrawSteelActiveEffect.validHud(status, this.actor)) continue;
      statusInfo[status.id] = {
        _id: status._id,
        name: status.name,
        img: status.img,
        disabled: false,
        active: "",
      };

      if (status.rule) {
        const page = await fromUuid(status.rule);
        statusInfo[status.id].tooltip = await enrichHTML(page.text.content, { relativeTo: this.actor });
      }
    }

    // If the actor has the status and it's not from the canonical statusEffect
    // Then we want to force more individual control rather than allow toggleStatusEffect
    for (const effect of this.actor.allApplicableEffects()) {
      for (const id of effect.statuses) {
        if (!(id in statusInfo)) continue;
        statusInfo[id].active = "active";
        if (!Object.values(statusInfo).some(s => s._id === effect._id)) statusInfo[id].disabled = true;
      }
    }

    return statusInfo;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
   * @return {Record<string, ActiveEffectCategory>} Data for rendering.
   * @protected
   */
  async _prepareActiveEffectCategories() {
    /** @type {Record<string, ActiveEffectCategory>} */
    const categories = {
      temporary: {
        type: "temporary",
        label: game.i18n.localize("DRAW_STEEL.ActiveEffect.Temporary"),
        effects: [],
      },
      passive: {
        type: "passive",
        label: game.i18n.localize("DRAW_STEEL.ActiveEffect.Passive"),
        effects: [],
      },
      inactive: {
        type: "inactive",
        label: game.i18n.localize("DRAW_STEEL.ActiveEffect.Inactive"),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    for (const e of this.actor.allApplicableEffects()) {
      const effectContext = {
        id: e.id,
        name: e.name,
        img: e.img,
        parent: e.parent,
        sourceName: e.sourceName,
        duration: e.duration,
        disabled: e.disabled,
        expanded: false,
      };

      if (this.#expandedDescriptions.has(e.uuid)) {
        effectContext.expanded = true;
        effectContext.enrichedDescription = await enrichHTML(e.description, { relativeTo: e });
      }

      if (!e.active) categories.inactive.effects.push(effectContext);
      else if (e.isTemporary) categories.temporary.effects.push(effectContext);
      else categories.passive.effects.push(effectContext);
    }

    // Sort each category
    for (const c of Object.values(categories)) {
      c.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }
    return categories;
  }

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /**
   * Actions performed after a first render of the Application.
   * @param {ApplicationRenderContext} context      Prepared context data.
   * @param {RenderOptions} options                 Provided render options.
   * @protected
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getDocumentListContextOptions, "[data-document-class][data-item-id], [data-document-class][data-effect-id]", {
      hookName: "getDocumentListContextOptions",
      parentClassHooks: false,
      fixed: true,
    });
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for embedded document lists.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getDocumentListContextOptions() {
    // name is auto-localized
    return [
      //Ability specific options
      {
        name: "DRAW_STEEL.Item.ability.SwapUsage.ToMelee",
        icon: "<i class=\"fa-solid fa-fw fa-sword\"></i>",
        condition: (target) => {
          let item = this._getEmbeddedDocument(target);
          return (item?.type === "ability") && (item?.system.distance.type === "meleeRanged") && (item?.system.damageDisplay === "ranged");
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          await item.update({ "system.damageDisplay": "melee" });
          await this.render();
        },
      },
      {
        name: "DRAW_STEEL.Item.ability.SwapUsage.ToRanged",
        icon: "<i class=\"fa-solid fa-fw fa-bow-arrow\"></i>",
        condition: (target) => {
          let item = this._getEmbeddedDocument(target);
          return (item?.type === "ability") && (item?.system.distance.type === "meleeRanged") && (item?.system.damageDisplay === "melee");
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          await item.update({ "system.damageDisplay": "ranged" });
          await this.render();
        },
      },
      // Kit specific options
      {
        name: "DRAW_STEEL.Item.kit.PreferredKit.MakePreferred",
        icon: "<i class=\"fa-solid fa-star\"></i>",
        condition: (target) => this._getEmbeddedDocument(target)?.type === "kit",
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          await this.actor.update({ "system.hero.preferredKit": item.id });
          await this.render();
        },
      },
      // Project specific options
      {
        name: "DRAW_STEEL.Item.project.SpendCareerPoints.Title",
        icon: "<i class=\"fa-solid fa-hammer\"></i>",
        condition: (target) => {
          const item = this._getEmbeddedDocument(target);
          if (item.type !== "project") return false;

          const careerPoints = foundry.utils.getProperty(this.actor, "system.career.system.projectPoints") ?? 0;
          const pointsToCompletion = Math.max(0, item.system.goal - item.system.points);

          return careerPoints && pointsToCompletion;
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          await item.system.spendCareerPoints();
          await this.render();
        },
      },
      // Equipment specific options
      {
        name: "DRAW_STEEL.Item.project.Craft.FromEquipment.Label",
        icon: "<i class=\"fa-solid fa-hammer\"></i>",
        condition: (target) => this._getEmbeddedDocument(target)?.type === "treasure",
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          const project = await item.system.createProject(this.actor);
          if (project) ui.notifications.success("DRAW_STEEL.Item.project.Craft.FromEquipment.Notification", { format: { item: item.name } });
        },
      },
      // All applicable options
      {
        name: "DRAW_STEEL.SHEET.View",
        icon: "<i class=\"fa-solid fa-fw fa-eye\"></i>",
        condition: () => this.isPlayMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true, mode: DrawSteelItemSheet.MODES.PLAY });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        condition: () => this.isEditMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true, mode: DrawSteelItemSheet.MODES.EDIT });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.Share",
        icon: "<i class=\"fa-solid fa-fw fa-share-from-square\"></i>",
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await DrawSteelChatMessage.create({
            content: `@Embed[${document.uuid} caption=false]`,
            speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
            title: document.name,
            flags: {
              core: { canPopout: true },
            },
          });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.Delete",
        icon: "<i class=\"fa-solid fa-fw fa-trash\"></i>",
        condition: () => this.actor.isOwner,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          if (document.hasGrantedItems) await document.advancementDeletionPrompt();
          else await document.deleteDialog();
        },
      },
    ];
  }

  /* -------------------------------------------------- */

  /**
   * Actions performed after any render of the Application.
   * @param {ApplicationRenderContext} context      Prepared context data.
   * @param {RenderOptions} options                 Provided render options.
   * @protected
   * @inheritdoc
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#disableOverrides();
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Toggle Edit vs. Play mode.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #toggleMode(event, target) {
    if (!this.isEditable) {
      console.error("You can't switch to Edit mode if the sheet is uneditable");
      return;
    }
    this._mode = this.isPlayMode ? DrawSteelActorSheet.MODES.EDIT : DrawSteelActorSheet.MODES.PLAY;
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Renders an embedded document's sheet in play or edit mode based on the actor sheet view mode.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    if (!doc) {
      console.error("Could not find document");
      return;
    }
    await doc.sheet.render({ force: true, mode: this._mode });
  }

  /* -------------------------------------------------- */

  /**
   * Handles item deletion.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    if (doc.hasGrantedItems) await doc.advancementDeletionPrompt();
    else await doc.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #createDoc(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass);
    const docData = {
      name: docCls.defaultName({ type: target.dataset.type, parent: this.actor }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (["action", "documentClass", "renderSheet"].includes(dataKey)) continue;
      // Nested properties use dot notation like `data-system.prop`
      foundry.utils.setProperty(docData, dataKey, value);
    }

    await docCls.create(docData, { parent: this.actor, renderSheet: target.dataset.renderSheet });
  }

  /* -------------------------------------------------- */

  /**
   * Creates or deletes a configured status effect.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleStatus(event, target) {
    const status = target.dataset.statusId;
    await this.actor.toggleStatusEffect(status);
  }

  /* -------------------------------------------------- */

  /**
   * Toggles an active effect from disabled to enabled.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /* -------------------------------------------------- */

  /**
   * Handle clickable rolls.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case "characteristic":
        return this.actor.rollCharacteristic(dataset.characteristic);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit niche combat data.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #editCombat(event, target) {
    new ActorCombatStatsInput({ document: this.document }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Handle clickable rolls.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #useAbility(event, target) {
    const item = this._getEmbeddedDocument(target);
    if (item?.type !== "ability") {
      console.error("This is not an ability!", item);
      return;
    }
    await item.system.use({ event });
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the effect description between visible and hidden. Only visible descriptions are generated in the HTML
   * TODO: Refactor re-rendering to instead use CSS transitions.
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #toggleEffectDescription(event, target) {
    const effect = this._getEmbeddedDocument(target);

    if (this.#expandedDescriptions.has(effect.uuid)) this.#expandedDescriptions.delete(effect.uuid);
    else this.#expandedDescriptions.add(effect.uuid);

    const part = target.closest("[data-application-part]").dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the item embed between visible and hidden. Only visible embeds are generated in the HTML
   * TODO: Refactor re-rendering to instead use CSS transitions.
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #toggleItemEmbed(event, target) {
    const { itemId } = target.closest(".item").dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest("[data-application-part]").dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /* -------------------------------------------------- */
  /*   Helper Functions                                 */
  /* -------------------------------------------------- */

  /**
   * Fetches the embedded document representing the containing HTML element.
   *
   * @param {HTMLElement} target    The element subject to search.
   * @returns {DrawSteelItem | DrawSteelActiveEffect} The embedded Item or ActiveEffect.
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest("[data-document-class]");
    if (docRow.dataset.documentClass === "Item") {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === "ActiveEffect") {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn("Could not find document class");
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /**
   * Handle a dropped Active Effect on the Actor Sheet.
   * The default implementation creates an Active Effect embedded document on the Actor.
   * @param {DragEvent} event       The initiating drop event.
   * @param {ActiveEffect} effect   The dropped ActiveEffect document.
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropActiveEffect(event, effect) {
    if (!this.actor.isOwner || !effect) return;
    if (effect.target === this.actor) await this._onSortActiveEffect(event, effect);
    else await super._onDropActiveEffect(event, effect);
  }

  /* -------------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings.
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   * @returns {Promise<void>}
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        ((siblingId !== effect.id) || (parentId !== effect.parent.id))
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments("ActiveEffect", updates);
    }

    // Update on the main actor
    this.actor.updateEmbeddedDocuments("ActiveEffect", directUpdates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== "Item") return []; // V14 - handle ActiveEffect
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);

        const keepId = !this.actor.items.has(item.id);

        return game.items.fromCompendium(item, { keepId, clearFolder: true });
      }),
    );
    this.actor.createEmbeddedDocuments("Item", droppedItemData, { keepId: true });
    return folder;
  }

  /* -------------------------------------------------- */
  /*   Actor Override Handling                          */
  /* -------------------------------------------------- */

  /**
   * Disables inputs subject to active effects.
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"][data-source="false"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }
}
