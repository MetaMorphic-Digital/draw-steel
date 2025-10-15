import { systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import DSDocumentSheetMixin from "../api/document-sheet-mixin.mjs";
import DocumentSourceInput from "../apps/document-source-input.mjs";
import BaseAdvancement from "../../data/pseudo-documents/advancements/base-advancement.mjs";

/**
 * @import DrawSteelActiveEffect from "../../documents/active-effect.mjs"
 * @import BaseItemModel from "../../data/item/base.mjs"
 */

const { sheets, ux } = foundry.applications;

/**
 * AppV2-based sheet for all item classes.
 */
export default class DrawSteelItemSheet extends DSDocumentSheetMixin(sheets.ItemSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["item"],
    position: {
      // Allows "Allow Me to Introduce Tonight’s Players" to fit in two lines
      // Also ensures the prosemirror editor bar doesn't overflow to a second line when selecting a paragraph element
      width: 580,
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
      createCultureAdvancement: this.#createCultureAdvancement,
      reconfigureAdvancement: this.#reconfigureAdvancement,
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
      template: systemPath("templates/sheets/item/header.hbs"),
      templates: ["templates/sheets/item/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: systemPath("templates/sheets/item/description.hbs"),
      scrollable: [""],
    },
    details: {
      template: systemPath("templates/sheets/item/details.hbs"),
      scrollable: [""],
    },
    advancement: {
      template: systemPath("templates/sheets/item/advancement.hbs"),
      scrollable: [""],
    },
    impact: {
      template: systemPath("templates/sheets/item/impact.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/sheets/item/effects.hbs"),
    },
  };

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
        context.enrichedDirectorNotes = await enrichHTML(this.item.system.description.director, { relativeTo: this.item });
        break;
      case "details":
        context.detailsPartial = this.item.system.constructor.metadata.detailsPartial ?? null;
        await this.item.system.getSheetContext(context);
        break;
      case "advancement":
        context.advancements = await this._getAdvancementContext();
        context.advancementIcon = BaseAdvancement.metadata.icon;
        break;
      case "impact":
        context.powerRollEffectIcon = ds.data.pseudoDocuments.powerRollEffects.BasePowerRollEffect.metadata.icon;
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
   * @typedef AdvancementContext
   * @property {number} level
   * @property {string} section
   * @property {BaseAdvancement} documents
   */

  /**
   * Prepares context info for the Advancements tab.
   * @returns {AdvancementContext[]}
   */
  async _getAdvancementContext() {
    // Advancements
    const advs = {};
    /** @type {foundry.utils.Collection<string, BaseAdvancement>} */
    const models = this.document.getEmbeddedCollection("Advancement")[
      this.isPlayMode ? "contents" : "sourceContents"
    ];
    for (const model of models) {
      if (!advs[model.requirements.level]) {
        const section = Number.isNumeric(model.requirements.level) ?
          game.i18n.format("DRAW_STEEL.ADVANCEMENT.HEADERS.level", { level: model.requirements.level }) :
          game.i18n.localize("DRAW_STEEL.ADVANCEMENT.HEADERS.null");
        advs[model.requirements.level] = {
          section,
          level: model.requirements.level,
          documents: [],
        };
      }
      const advancementContext = {
        name: model.name,
        img: model.img,
        id: model.id,
        canReconfigure: model.canReconfigure,
      };
      if (model.description) advancementContext.enrichedDescription = await enrichHTML(model.description, { relativeTo: this.document });
      advs[model.requirements.level].documents.push(advancementContext);
    }

    return Object.values(advs).sort((a, b) => a.level - b.level);
  }

  /* -------------------------------------------------- */

  /**
   * @typedef ActiveEffectCategory
   * @property {string} type                 - The type of category.
   * @property {string} label                - The localized name of the category.
   * @property {Array<ActiveEffect>} effects - The effects in the category.
   */

  /**
   * Prepare the data structure for Active Effects which are currently embedded in an Item.
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
      applied: {
        type: "applied",
        label: game.i18n.localize("DRAW_STEEL.ActiveEffect.Applied"),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    const effects = this.item.effects.contents.sort((a, b) => a.sort - b.sort);
    for (const e of effects) {
      const effectContext = {
        id: e.id,
        uuid: e.uuid,
        name: e.name,
        img: e.img,
        sourceName: e.sourceName,
        duration: e.duration,
        disabled: e.disabled,
        expanded: false,
      };

      if (this._expandedDocumentDescriptions.has(e.id)) {
        effectContext.expanded = true;
        effectContext.enrichedDescription = await e.system.toEmbed({});
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
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /** @inheritdoc*/
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._createEffectContextOptions, ".effect-list-container .effect-create", {
      hookName: "createEffectContextOptions",
      parentClassHooks: false,
      fixed: true,
      eventName: "click",
    });
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for creating.
   * @returns {ContextMenuEntry[]}
   */
  _createEffectContextOptions() {
    return [
      {
        name: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("DOCUMENT.ActiveEffect") }),
        icon: `<i class="${CONFIG.ActiveEffect.typeIcons.base}"></i>`,
        condition: () => this.isEditable,
        callback: (target) => {
          const effectClass = getDocumentClass("ActiveEffect");
          const effectData = {
            name: effectClass.defaultName({ parent: this.item }),
            img: this.document.img,
            type: "base",
            origin: this.item.uuid,
          };
          for (const [dataKey, value] of Object.entries(target.dataset)) {
            if (["action", "documentClass", "renderSheet"].includes(dataKey)) continue;
            foundry.utils.setProperty(effectData, dataKey, value);
          }

          effectClass.create(effectData, { parent: this.item, renderSheet: true });
        },
      },
      {
        name: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("TYPES.ActiveEffect.abilityModifier") }),
        icon: `<i class="${CONFIG.ActiveEffect.typeIcons.abilityModifier}"></i>`,
        condition: () => this.isEditable,
        callback: (target) => {
          const effectClass = getDocumentClass("ActiveEffect");
          const effectData = {
            name: effectClass.defaultName({ parent: this.item, type: "abilityModifier" }),
            img: this.document.img,
            type: "abilityModifier",
            origin: this.item.uuid,
          };
          for (const [dataKey, value] of Object.entries(target.dataset)) {
            if (["action", "documentClass", "renderSheet"].includes(dataKey)) continue;
            foundry.utils.setProperty(effectData, dataKey, value);
          }

          effectClass.create(effectData, { parent: this.item, renderSheet: true });
        },
      },
    ];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
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
    /** @type {Array<HTMLElement>} */
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
   * Toggle Edit vs. Play mode.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
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
   * Display the item image.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #showImage(event, target) {
    const { img, name, uuid } = this.item;
    new foundry.applications.apps.ImagePopout({ src: img, uuid, window: { title: name } }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #updateSource(event, target) {
    new DocumentSourceInput({ document: this.document }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Active editor instance in the description tab.
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
   * Create a TextEditor instance that takes up the whole tab.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
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
    this.#editor = await ux.ProseMirrorEditor.create(editorContainer, content, {
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
   * Renders an embedded document's sheet.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #viewEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    effect.sheet.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Handles item deletion.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #deleteEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.deleteDialog();
  }

  /* -------------------------------------------------- */

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
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
   * Determines effect parent to pass to helper.
   *
   * @this DrawSteelItemSheet
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
   * Creates an advancement on a culture, with additional logic to simplify creating "aspects".
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #createCultureAdvancement(event, target) {
    const context = BaseAdvancement._prepareCreateDialogContext(this.document);

    const aspectPrefix = "cultureAspect";

    for (const [key, config] of Object.entries(ds.CONFIG.culture.aspects)) {
      context.typeOptions.push({
        label: config.label,
        group: ds.CONFIG.culture.group[config.group]?.label,
        value: `${aspectPrefix}.${key}`,
      });
    }

    const content = await foundry.applications.handlebars.renderTemplate(BaseAdvancement.CREATE_TEMPLATE, context);

    const result = await ds.applications.api.DSDialog.input({
      window: {
        title: game.i18n.format("DOCUMENT.New", { type: game.i18n.localize("DOCUMENT.Advancement") }),
        icon: BaseAdvancement.metadata.icon,
      },
      content,
      render: (event, dialog) => {
        const typeInput = dialog.element.querySelector("[name=\"type\"]");
        const nameInput = dialog.element.querySelector("[name=\"name\"]");
        nameInput.placeholder = context.typeOptions.find(o => o.value === typeInput.value).label;
        typeInput.addEventListener("change", () => nameInput.placeholder = context.typeOptions.find(o => o.value === typeInput.value).label);
      },
    });
    if (!result) return;

    const [type, aspect] = result.type.split(".");
    let createData;

    if (type === aspectPrefix) {
      const config = ds.CONFIG.culture.aspects[aspect];

      createData = {
        type: "skill",
        name: config.label,
        chooseN: 1,
        skills: {
          groups: Array.from(config.skillGroups),
          choices: Array.from(config.skillChoices),
        },
      };
    } else createData = { type };
    ds.data.pseudoDocuments.advancements.SkillAdvancement.create(createData, { parent: this.document });
  }

  /**
   * Reconfigure an existing advancement on an actor.
   *
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #reconfigureAdvancement(event, target) {
    if (!this.document.parent) throw new Error("You can only reconfigure advancements if the item is embedded in an actor");
    const advancement = this._getPseudoDocument(target);
    await advancement.reconfigure();
  }

  /* -------------------------------------------------- */
  /*   DragDrop                                         */
  /* -------------------------------------------------- */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector.
   * @param {string} selector       The candidate HTML selector for dragging.
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /* -------------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector.
   * @param {string} selector       The candidate HTML selector for the drop target.
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
   * @param {DragEvent} event       The originating DragEvent.
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
   * @param {DragEvent} event       The originating DragEvent.
   * @protected
   */
  _onDragOver(event) {}

  /* -------------------------------------------------- */

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent.
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
   * Handle the dropping of ActiveEffect data onto an Actor Sheet.
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data.
   * @param {object} data                      The data transfer extracted from the event.
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
   * Sorts an Active Effect based on its surrounding attributes.
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
    const sortUpdates = foundry.utils.performIntegerSort(effect, {
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
   * Handle dropping of an Actor data onto another Actor sheet.
   * @param {DragEvent} event            The concluding DragEvent which contains drop data.
   * @param {object} data                The data transfer extracted from the event.
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet.
   * @param {DragEvent} event            The concluding DragEvent which contains drop data.
   * @param {object} data                The data transfer extracted from the event.
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
   * @param {DragEvent} event     The concluding DragEvent which contains drop data.
   * @param {object} data         The data transfer extracted from the event.
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.item.isOwner) return [];
  }

  /* -------------------------------------------------- */

  /**
   * Returns an array of DragDrop instances.
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  /* -------------------------------------------------- */

  /**
   * Create drag-and-drop workflow handlers for this Application.
   * @returns {DragDrop[]}     An array of DragDrop handlers.
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
