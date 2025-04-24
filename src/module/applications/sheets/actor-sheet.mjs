import { AbilityModel, FeatureModel } from "../../data/item/_module.mjs";
import { DrawSteelChatMessage, DrawSteelItem } from "../../documents/_module.mjs";
import DrawSteelItemSheet from "./item-sheet.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */
/** @import { ActorSheetItemContext, ActorSheetAbilitiesContext } from "./_types.js" */

const { api, sheets } = foundry.applications;

/**
 * AppV2-based sheet for all actor classes
 */
export default class DrawSteelActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "actor"],
    position: {
      width: 700,
      height: 600,
    },
    window: {
      resizable: true,
    },
    actions: {
      toggleMode: this.#toggleMode,
      viewDoc: this.#viewDoc,
      createDoc: this.#createDoc,
      deleteDoc: this.#deleteDoc,
      toggleEffect: this.#toggleEffect,
      roll: this.#onRoll,
      useAbility: this.#useAbility,
      toggleItemEmbed: this.#toggleItemEmbed,
    },
    form: {
      submitOnChange: true,
    },
  };

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

  /**
   * Available sheet modes.
   * @enum {number}
   */
  static MODES = Object.freeze({
    PLAY: 1,
    EDIT: 2,
  });

  /**
   * The mode the sheet is currently in.
   * @type {DrawSteelActorSheet.MODES}
   */
  #mode = DrawSteelActorSheet.MODES.PLAY;

  /**
   * A set of the currently expanded item ids
   * @type {Set<string>}
   */
  #expanded = new Set();

  /**
   * Is this sheet in Play Mode?
   * @returns {boolean}
   */
  get isPlayMode() {
    return this.#mode === DrawSteelActorSheet.MODES.PLAY;
  }

  /**
   * Is this sheet in Edit Mode?
   * @returns {boolean}
   */
  get isEditMode() {
    return this.#mode === DrawSteelActorSheet.MODES.EDIT;
  }

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    if (this.document.limited) {
      const { header, tabs, biography } = parts;
      return { header, tabs, biography };
    }

    return parts;
  }

  /** @inheritdoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.mode && this.isEditable) this.#mode = options.mode;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = Object.assign(await super._prepareContext(options), {
      isPlay: this.isPlayMode,
      // Validates both permissions and compendium status
      owner: this.document.isOwner,
      limited: this.document.limited,
      gm: game.user.isGM,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      systemSource: this.actor.system._source,
      flags: this.actor.flags,
      // Adding a pointer to ds.CONFIG
      config: ds.CONFIG,
      // Necessary for formInput and formFields helpers
      systemFields: this.document.system.schema.fields,
      datasets: this._getDatasets(),
    });

    return context;
  }

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);

    if (group === "primary") {
      if (this.document.limited) {
        tabs.biography.active = true;
        tabs.biography.cssClass = "active";
        return { biography: tabs.biography };
      }

      if (this.document.type !== "character") {
        delete tabs.equipment;
        delete tabs.projects;
      }
    }

    return tabs;
  }

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    switch (partId) {
      case "stats":
        context.characteristics = this._getCharacteristics();
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
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography.value,
          {
            secrets: this.document.isOwner,
            rollData: this.actor.getRollData(),
            relativeTo: this.actor,
          },
        );
        context.enrichedGMNotes = await TextEditor.enrichHTML(
          this.actor.system.biography.gm,
          {
            secrets: this.document.isOwner,
            rollData: this.actor.getRollData(),
            relativeTo: this.actor,
          },
        );
        break;
      case "effects":
        context.effects = this.prepareActiveEffectCategories();
        break;
    }
    if (partId in context.tabs) context.tab = context.tabs[partId];
    return context;
  }

  /**
   * @typedef {import("@common/data/fields.mjs").NumberField} NumberField
   */

  /**
   * Constructs a record of valid characteristics and their associated field
   * @returns {Record<string, {field: NumberField, value: number}>}
   */
  _getCharacteristics() {
    const data = this.isPlayMode ? this.actor : this.actor._source;
    return Object.keys(ds.CONFIG.characteristics).reduce((obj, chc) => {
      obj[chc] = {
        field: this.actor.system.schema.getField(["characteristics", chc, "value"]),
        value: foundry.utils.getProperty(data, `system.characteristics.${chc}.value`),
      };
      return obj;
    }, {});
  }

  /**
   * Constructs an object with the actor's movement types as well as all options available from CONFIG.Token.movement.actions
   * @returns {{flying: boolean, list: string, options: FormSelectOption[]}}
   */
  _getMovement() {
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const actorMovement = this.actor.system.movement;
    const flying = actorMovement.types.has("fly");
    const movementList = Array.from(actorMovement.types).map(m => {
      let label = game.i18n.localize(CONFIG.Token.movement.actions[m]?.label ?? m);
      if ((m === "teleport") && (actorMovement.teleport !== actorMovement.value)) label += " " + actorMovement.teleport;
      return label;
    });
    if (flying && actorMovement.hover) movementList.push(game.i18n.localize("DRAW_STEEL.Actor.base.FIELDS.movement.hover.label"));
    return {
      flying,
      list: formatter.format(movementList),
      options: Object.entries(CONFIG.Token.movement.actions)
        .filter(([key, _action]) => ds.CONFIG.speedOptions.includes(key))
        .map(([value, { label }]) => ({ value, label })),
    };
  }

  /**
   * Constructs an object with the actor's languages as well as all options available from CONFIG.DRAW_STEEL.languages
   * @returns {{list: string, options: FormSelectOption[]}}
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

  /**
   * Constructs an object with the formatted immunities and weaknesses with a list of damage labels
   * @returns {{immunities: string, weaknesses: string, labels: Record<string, string>}}
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

  /**
   * Helper to compose datasets available in the hbs
   * @returns {Record<string, unknown>}
   */
  _getDatasets() {
    return {
      isSource: { source: true },
      notSource: { source: false },
    };
  }

  /**
   * Generate the context data shared between item types
   * @param {DrawSteelItem} item
   * @returns {ActorSheetItemContext}
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

  /**
   * Prepare the context for features
   * @returns {Array<ActorSheetItemContext>}
   */
  async _prepareFeaturesContext() {
    const features = this.actor.itemTypes.feature.toSorted((a, b) => a.sort - b.sort);
    const context = [];

    for (const feature of features) {
      context.push(await this._prepareItemContext(feature));
    }

    return context;
  }

  /**
   * Prepare the context for ability categories and individual abilities
   * @returns {Record<keyof typeof ds["CONFIG"]["abilities"]["types"] | "other", ActorSheetAbilitiesContext>}
   */
  async _prepareAbilitiesContext() {
    const context = {};
    const abilities = this.actor.itemTypes.ability.toSorted((a, b) => a.sort - b.sort);

    // Prepare ability categories for each ability type
    for (const [type, config] of Object.entries(ds.CONFIG.abilities.types)) {
      // Don't show villain actions on non-NPC sheets
      if ((type === "villain") && (this.actor.type !== "npc")) continue;

      context[type] = {
        label: config.label,
        abilities: [],
      };
    }

    // Adding here instead of the initial context declaration so that the "other" category appears last on the character sheet
    context["other"] = {
      label: game.i18n.localize("DRAW_STEEL.Sheet.Other"),
      abilities: [],
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

      context[type].abilities.push(abilityContext);
    }

    return context;
  }

  /**
   * @typedef ActiveEffectCategory
   * @property {string} type                 - The type of category
   * @property {string} label                - The localized name of the category
   * @property {Array<ActiveEffect>} effects - The effects in the category
   */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
   * @return {Record<string, ActiveEffectCategory>} Data for rendering
   */
  prepareActiveEffectCategories() {
    /** @type {Record<string, ActiveEffectCategory>} */
    const categories = {
      temporary: {
        type: "temporary",
        label: game.i18n.localize("DRAW_STEEL.Effect.Temporary"),
        effects: [],
      },
      passive: {
        type: "passive",
        label: game.i18n.localize("DRAW_STEEL.Effect.Passive"),
        effects: [],
      },
      inactive: {
        type: "inactive",
        label: game.i18n.localize("DRAW_STEEL.Effect.Inactive"),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    for (const e of this.actor.allApplicableEffects()) {
      if (!e.active) categories.inactive.effects.push(e);
      else if (e.isTemporary) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
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
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getItemButtonContextOptions, "[data-document-class]", { hookName: "getItemButtonContextOptions", parentClassHooks: false, fixed: true });
  }

  /**
   * Get context menu entries for item buttons.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getItemButtonContextOptions() {
    // name is auto-localized
    return [
      //Ability specific options
      {
        name: "DRAW_STEEL.Item.Ability.SwapUsage.ToMelee",
        icon: "<i class=\"fa-solid fa-fw fa-sword\"></i>",
        condition: (target) => {
          let item = this._getEmbeddedDocument(target);
          return (item?.type === "ability") && (item?.system.distance.type === "meleeRanged") && (item?.system.damageDisplay === "ranged");
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.update({ "system.damageDisplay": "melee" });
          await this.render();
        },
      },
      {
        name: "DRAW_STEEL.Item.Ability.SwapUsage.ToRanged",
        icon: "<i class=\"fa-solid fa-fw fa-bow-arrow\"></i>",
        condition: (target) => {
          let item = this._getEmbeddedDocument(target);
          return (item?.type === "ability") && (item?.system.distance.type === "meleeRanged") && (item?.system.damageDisplay === "melee");
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.update({ "system.damageDisplay": "ranged" });
          await this.render();
        },
      },
      // Kit specific options
      {
        name: "DRAW_STEEL.Item.Kit.PreferredKit.MakePreferred",
        icon: "<i class=\"fa-solid fa-star\"></i>",
        condition: (target) => this._getEmbeddedDocument(target)?.type === "kit",
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await this.actor.update({ "system.hero.preferredKit": item.id });
          await this.render();
        },
      },
      // All applicable options
      {
        name: "View",
        icon: "<i class=\"fa-solid fa-fw fa-eye\"></i>",
        condition: () => this.isPlayMode,
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.sheet.render({ force: true, mode: DrawSteelItemSheet.MODES.PLAY });
        },
      },
      {
        name: "Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        condition: () => this.isEditMode,
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.sheet.render({ force: true, mode: DrawSteelItemSheet.MODES.EDIT });
        },
      },
      {
        name: "DRAW_STEEL.Item.base.share",
        icon: "<i class=\"fa-solid fa-fw fa-share-from-square\"></i>",
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await DrawSteelChatMessage.create({
            content: `@Embed[${item.uuid} caption=false]`,
            speaker: DrawSteelChatMessage.getSpeaker({ actor: this.actor }),
          });
        },
      },
      {
        name: "Delete",
        icon: "<i class=\"fa-solid fa-fw fa-trash\"></i>",
        condition: () => this.actor.isOwner,
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.deleteDialog();
        },
      },
    ];
  }

  /**
   * Actions performed after any render of the Application.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
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
   * Toggle Edit vs. Play mode
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #toggleMode(event, target) {
    if (!this.isEditable) {
      console.error("You can't switch to Edit mode if the sheet is uneditable");
      return;
    }
    this.#mode = this.isPlayMode ? DrawSteelActorSheet.MODES.EDIT : DrawSteelActorSheet.MODES.PLAY;
    this.render();
  }

  /**
   * Renders an embedded document's sheet in play or edit mode based on the actor sheet view mode
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    if (!doc) {
      console.error("Could not find document");
      return;
    }
    await doc.sheet.render({ force: true, mode: this.#mode });
  }

  /**
   * Handles item deletion
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.deleteDialog();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
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

  /**
   * Determines effect parent to pass to helper
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
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

  /**
   * Handle clickable rolls.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
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

  /**
   * Toggle the item embed between visible and hidden. Only visible embeds are generated in the HTML
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #toggleItemEmbed(event, target) {
    const { itemId } = target.closest(".item").dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest("[data-application-part]").dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
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
   * @param {DragEvent} event       The initiating drop event
   * @param {ActiveEffect} effect   The dropped ActiveEffect document
   * @returns {Promise<void>}
   * @protected
   */
  async _onDropActiveEffect(event, effect) {
    if (!this.actor.isOwner || !effect) return;
    if (effect.target === this.actor) await this._onSortActiveEffect(event, effect);
    else await super._onDropActiveEffect(event, effect);
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
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

  /** @inheritdoc */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== "Item") return [];
    const projectDropTarget = event.target.closest("[data-application-part='projects'");
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);

        // If it's an equipment dropped on the project tab, create the item as a project
        if (projectDropTarget && (item.type === "equipment")) {
          const name = game.i18n.format("DRAW_STEEL.Item.Project.Craft.ItemName", { name: item.name });
          item = { name, type: "project", "system.yield.item": item.uuid };
        }

        return item;
      }),
    );
    this.actor.createEmbeddedDocuments("Item", droppedItemData);
  }

  /* -------------------------------------------------- */
  /*   Actor Override Handling                         */
  /* -------------------------------------------------- */

  /**
   * Disables inputs subject to active effects
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
