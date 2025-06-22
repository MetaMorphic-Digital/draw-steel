import { systemPath } from "../../constants.mjs";
import BasePowerRollEffect from "../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import DSDocumentSheetMixin from "../api/document-sheet-mixin.mjs";
import DocumentSourceInput from "../apps/document-source-input.mjs";

/** @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs" */
/** @import DrawSteelActiveEffect from "../../documents/active-effect.mjs" */
/** @import BaseItemModel from "../../data/item/base.mjs" */

const { sheets, ux } = foundry.applications;

/**
 * AppV2-based sheet for all item classes
 */
export default class DrawSteelItemSheet extends DSDocumentSheetMixin(sheets.ItemSheet) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["item"],
    position: {
      // Allows "Their Lack of Focus is Their Undoing" to fit in two lines
      // Also ensures the prosemirror editor bar doesn't overflow to a second line when selecting a paragraph element
      width: 560,
    },
    actions: {
      toggleMode: this.#toggleMode,
      showImage: this.#showImage,
      updateSource: this.#updateSource,
      editHTML: this.#editHTML,
      viewDoc: this.#viewEffect,
      createDoc: this.#createEffect,
      deleteDoc: this.#deleteEffect,
      toggleEffect: this.#toggleEffect,
      toggleEffectDescription: this.#toggleEffectDescription,
      editPowerRollEffect: this.#editPowerRoll,
      deletePowerRollEffect: this.#deletePowerRoll,
      createPowerRollEffect: this.#createPowerRoll,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: ".draggable", dropSelector: null }],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "description" },
        { id: "details" },
        { id: "advancement" },
        { id: "impact" },
        { id: "effects" },
      ],
      initial: "description",
      labelPrefix: "DRAW_STEEL.Item.Tabs",
    },
  };

  /* -------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/item/header.hbs"),
      templates: ["templates/item/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: systemPath("templates/item/description.hbs"),
    },
    details: {
      template: systemPath("templates/item/details.hbs"),
      scrollable: [""],
    },
    advancement: {
      template: systemPath("templates/item/advancement.hbs"),
    },
    impact: {
      template: systemPath("templates/item/impact.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/item/effects.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /**
   * A set of the currently expanded effect IDs
   * @type {Set<string>}
   */
  #expanded = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const { header, tabs, description, details, advancement, impact, effects } = super._configureRenderParts(options);

    const parts = { header, tabs };

    /** @type {typeof BaseItemModel} */
    const itemModel = this.item.system.constructor;

    // Don't re-render the description tab if there's an active editor
    if (!this.#editor && itemModel.schema.has("description")) parts.description = description;
    if (this.document.limited) return;
    if (this.item.system.constructor.metadata.detailsPartial) parts.details = details;
    if ("Advancement" in itemModel.metadata.embedded) parts.advancement = advancement;
    if ("PowerRollEffect" in itemModel.metadata.embedded) parts.impact = impact;
    parts.effects = effects;

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    // If there's no description, set the active tab to details
    if ((this.tabGroups.primary === "description") && !this.item.system.constructor.schema.has("description")) this.tabGroups.primary = "details";

    // One tab group means ApplicationV2#_prepareContext will populate `tabs`
    const context = await super._prepareContext(options);

    Object.assign(context, {
      system: context.isPlay ? context.system : context.systemSource,
      tabGroups: this.tabGroups,
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    if (partId in context.tabs) context.tab = context.tabs[partId];

    switch (partId) {
      case "description":
        context.enrichedDescription = await enrichHTML(this.item.system.description.value, { relativeTo: this.item });
        context.enrichedGMNotes = await enrichHTML(this.item.system.description.gm, { relativeTo: this.item });
        break;
      case "details":
        context.detailsPartial = this.item.system.constructor.metadata.detailsPartial ?? null;
        await this.item.system.getSheetContext(context);
        break;
      case "impact":
        context.enrichedBeforeEffect = await enrichHTML(this.item.system.effect.before, { relativeTo: this.item });
        context.enrichedAfterEffect = await enrichHTML(this.item.system.effect.after, { relativeTo: this.item });
        break;
      case "effects":
        context.effects = await this._prepareActiveEffectCategories();
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (group === "primary") {
      /** @type {typeof BaseItemModel} */
      const itemModel = this.item.system.constructor;
      if (!itemModel.schema.has("description")) delete tabs.description;
      if (!itemModel.metadata.detailsPartial) delete tabs.details;
      if (!("Advancement" in itemModel.metadata.embedded)) delete tabs.advancement;
      if (!("PowerRollEffect" in itemModel.metadata.embedded)) delete tabs.impact;
    }

    return tabs;
  }

  /* -------------------------------------------------- */

  /**
   * @typedef ActiveEffectCategory
   * @property {string} type                 - The type of category
   * @property {string} label                - The localized name of the category
   * @property {Array<ActiveEffect>} effects - The effects in the category
   */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in an Item.
   * @return {Record<string, ActiveEffectCategory>} Data for rendering
   * @protected
   */
  async _prepareActiveEffectCategories() {
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
      applied: {
        type: "applied",
        label: game.i18n.localize("DRAW_STEEL.Effect.Applied"),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    for (const e of this.item.effects) {
      const effectContext = {
        id: e.id,
        name: e.name,
        img: e.img,
        sourceName: e.sourceName,
        duration: e.duration,
        disabled: e.disabled,
        expanded: false,
      };

      if (this.#expanded.has(e.id)) {
        effectContext.expanded = true;
        effectContext.enrichedDescription = await enrichHTML(e.description, { relativeTo: e });
      }

      if (!e.transfer) categories.applied.effects.push(effectContext);
      else if (!e.active) categories.inactive.effects.push(effectContext);
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

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._powerRollContextOptions, ".power-roll-list .power-roll", {
      hookName: "getPowerRollEffectContextOptions",
      fixed: true,
      parentClassHooks: false,
    });
  }

  /**
   * Context menu entries for power rolls
   * @returns {ContextMenuEntry}
   * @protected
   */
  _powerRollContextOptions() {
    return [
      {
        name: game.i18n.format("DOCUMENT.Delete", { type: game.i18n.localize("DOCUMENT.PowerRollEffect") }),
        icon: "<i class=\"fa-solid fa-fw fa-trash-can\"></i>",
        condition: () => this.isEditable,
        callback: (target) => {
          const powerRollEffect = this._getPowerRoll(target);
          ui.notifications.info("DRAW_STEEL.PSEUDO.Notifications.DeletedInfo", { format: {
            pseudoName: game.i18n.localize("DOCUMENT.PowerRollEffect"),
            id: powerRollEffect.id,
            type: powerRollEffect.type,
            name: this.item.name,
          } });
          powerRollEffect.delete();
        },
      },
    ];
  }

  /** @inheritdoc*/
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#dragDrop.forEach((d) => d.bind(this.element));

    // Bubble editor active class state to containing formGroup
    /** @type {Array<HTMLButtonElement>} */
    const editorButtons = this.element.querySelectorAll("prose-mirror button[type=\"button\"]");
    for (const button of editorButtons) {
      const formGroup = button.closest(".form-group");
      const tabSection = button.closest("section.tab");
      button.addEventListener("click", (ev) => {
        formGroup.classList.add("active");
        tabSection.classList.add("editorActive");
      });
    }
    /** @type {Array<HTMLElement} */
    const editors = this.element.querySelectorAll("prose-mirror");
    for (const ed of editors) {
      const formGroup = ed.closest(".form-group");
      const tabSection = ed.closest("section.tab");
      ed.addEventListener("close", (ev) => {
        formGroup.classList.remove("active");
        tabSection.classList.remove("editorActive");
      });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(options) {
    super._onClose(options);
    if (this.#editor) this.#saveEditor();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);

    if (partId === "details") this.item.system._attachPartListeners(htmlElement, options);
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Toggle Edit vs. Play mode
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #toggleMode(event, target) {
    if (!this.isEditable) {
      console.error("You can't switch to Edit mode if the sheet is uneditable");
      return;
    }
    this._mode = this.isPlayMode ? DrawSteelItemSheet.MODES.EDIT : DrawSteelItemSheet.MODES.PLAY;
    if (this.isPlayMode && this.#editor) await this.#saveEditor();
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Display the item image
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #showImage(event, target) {
    const { img, name, uuid } = this.item;
    new foundry.applications.apps.ImagePopout({ src: img, uuid, window: { title: name } }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #updateSource(event, target) {
    new DocumentSourceInput({ document: this.document }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Active editor instance in the description tab
   * @type {ProseMirrorEditor}
   */
  #editor = null;

  /* -------------------------------------------------- */

  /**
   * Handle saving the editor content.
   */
  async #saveEditor() {
    const newValue = ProseMirror.dom.serializeString(this.#editor.view.state.doc.content);
    const [uuid, fieldName] = this.#editor.uuid.split("#");
    this.#editor.destroy();
    this.#editor = null;
    const currentValue = foundry.utils.getProperty(this.item, fieldName);
    if (newValue !== currentValue) {
      await this.item.update({ [fieldName]: newValue });
    } else await this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Create a TextEditor instance that takes up the whole tab
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #editHTML(event, target) {
    /** @type {HTMLDivElement} */
    const tab = target.closest("section.tab");
    /** @type {HTMLDivElement} */
    const wrapper = target.closest(".prosemirror.editor");
    tab.classList.add("editorActive");
    wrapper.classList.add("active");
    /** @type {HTMLDivElement} */
    const editorContainer = wrapper.querySelector(".editor-content");
    const content = foundry.utils.getProperty(this.item, target.dataset.fieldName);
    this.#editor = await ProseMirrorEditor.create(editorContainer, content, {
      document: this.item,
      fieldName: target.dataset.fieldName,
      relativeLinks: true,
      collaborate: true,
      plugins: {
        menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
          destroyOnSave: true,
          onSave: this.#saveEditor.bind(this),
        }),
        keyMaps: ProseMirror.ProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
          onSave: this.#saveEditor.bind(this),
        }),
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Renders an embedded document's sheet
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #viewEffect(event, target) {
    const effect = this._getEffect(target);
    effect.sheet.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Handles item deletion
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #deleteEffect(event, target) {
    const effect = this._getEffect(target);
    await effect.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #createEffect(event, target) {
    const aeCls = getDocumentClass("ActiveEffect");
    const effectData = {
      name: aeCls.defaultName({ type: target.dataset.type, parent: this.item }),
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (["action", "documentClass"].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      foundry.utils.setProperty(effectData, dataKey, value);
    }

    await aeCls.create(effectData, { parent: this.item });
  }

  /* -------------------------------------------------- */

  /**
   * Determines effect parent to pass to helper
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEffect(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the effect description between visible and hidden. Only visible descriptions are generated in the HTML
   * TODO: Refactor re-rendering to instead use CSS transitions
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async #toggleEffectDescription(event, target) {
    const effect = this._getEffect(target);

    if (this.#expanded.has(effect.id)) this.#expanded.delete(effect.id);
    else this.#expanded.add(effect.id);

    const part = target.closest("[data-application-part]").dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /* -------------------------------------------------- */

  /**
   * Edits a power roll pseudo document
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #editPowerRoll(event, target) {
    const powerRollEffect = this._getPowerRoll(target);
    powerRollEffect.sheet.render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Deletes a power roll pseudo document
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #deletePowerRoll(event, target) {
    const powerRollEffect = this._getPowerRoll(target);
    powerRollEffect.delete();
  }

  /* -------------------------------------------------- */

  /**
   * Creates a power roll pseudo document
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async #createPowerRoll(event, target) {
    BasePowerRollEffect.createDialog({}, { parent: this.item });
  }

  /* -------------------------------------------------- */
  /*   Helper Functions                                 */
  /* -------------------------------------------------- */

  /**
   * Fetches the row with the data for the rendered embedded document
   *
   * @param {HTMLElement} target  The element with the action
   * @returns {DrawSteelActiveEffect} The document's row
   */
  _getEffect(target) {
    const li = target.closest(".effect");
    return this.item.effects.get(li?.dataset?.effectId);
  }

  /**
   * Fetches a Power Roll Effect pseudo-document
   * @param {HTMLElement} target The element with the action
   * @returns {BasePowerRollEffect} The document
   */
  _getPowerRoll(target) {
    const btn = target.closest(".power-roll");
    return this.item.getEmbeddedDocument("PowerRollEffect", btn?.dataset?.id);
  }

  /* -------------------------------------------------- */
  /*   DragDrop                                         */
  /* -------------------------------------------------- */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /* -------------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /* -------------------------------------------------- */

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ("link" in event.target.dataset) return;

    let dragData = null;

    // Active Effect
    if (li.dataset.effectId) {
      const effect = this.item.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------------- */

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /* -------------------------------------------------- */

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = ux.TextEditor.implementation.getDragEventData(event);
    const item = this.item;
    const allowed = Hooks.call("dropItemSheetData", item, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass("ActiveEffect");
    const effect = await aeCls.fromDropData(data);
    if (!this.item.isOwner || !effect) return false;

    if (this.item.uuid === effect.parent?.uuid)
      return this._onEffectSort(event, effect);
    return aeCls.create(effect, { parent: this.item });
  }

  /* -------------------------------------------------- */

  /**
   * Sorts an Active Effect based on its surrounding attributes
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  _onEffectSort(event, effect) {
    const effects = this.item.effects;
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = effects.get(dropTarget.dataset.effectId);

    // Don't sort on yourself
    if (effect.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && (siblingId !== effect.id))
        siblings.push(effects.get(el.dataset.effectId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.item.isOwner) return [];
  }

  /* -------------------------------------------------- */

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  /* -------------------------------------------------- */

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new ux.DragDrop.implementation(d);
    });
  }

  /* -------------------------------------------------- */

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop = this.#createDragDropHandlers();
}
