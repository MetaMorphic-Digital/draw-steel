import { systemPath } from "../../constants.mjs";
import { DrawSteelActiveEffect, DrawSteelChatMessage } from "../../documents/_module.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import DSDocumentSheet from "../api/document-sheet.mjs";
import DocumentSourceInput from "../apps/document-source-input.mjs";
import BaseAdvancement from "../../data/pseudo-documents/advancements/base-advancement.mjs";
import BasePowerRollEffect from "../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";

/**
 * @import ProseMirrorEditor from "@client/applications/ux/prosemirror-editor.mjs";
 * @import { DrawSteelActiveEffect, DrawSteelItem } from "../../documents/_module.mjs";
 * @import BaseItemModel from "../../data/item/base.mjs";
 * @import PseudoDocument from "../../data/pseudo-documents/pseudo-document.mjs";
 */

const { ux } = foundry.applications;

/**
 * AppV2-based sheet for all item subtypes.
 */
export default class DrawSteelItemSheet extends DSDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["item"],
    position: {
      // Allows "Allow Me to Introduce Tonight’s Players" to fit in two lines
      // Also ensures the prosemirror editor bar doesn't overflow to a second line when selecting a paragraph element
      width: 580,
    },
    actions: {
      showImage: this.#showImage,
      updateSource: this.#updateSource,
      editHTML: this.#editHTML,
      toggleEffect: this.#toggleEffect,
      createCultureAdvancement: this.#createCultureAdvancement,
      reconfigureAdvancement: this.#reconfigureAdvancement,
    },
    window: {
      controls: [{
        icon: "fa-solid fa-file-arrow-down",
        label: "DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Label",
        action: "updateFromCompendium",
        visible: DrawSteelItemSheet.#canUpdateFromCompendium,
      }],
    },
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

  /**
   * The Item document managed by this sheet.
   * @type {DrawSteelItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const { header, tabs, description, details, advancement, impact, effects } = super._configureRenderParts(options);

    const parts = { header, tabs };

    /** @type {typeof BaseItemModel} */
    const itemModel = this.item.system.constructor;

    // Don't re-render the description tab if there's an active editor
    if (!this.#editor && itemModel.schema.has("description")) parts.description = description;
    if (this.item.limited) return;
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
        context.powerRollEffectIcon = BasePowerRollEffect.metadata.icon;
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
    /** @type {Record<string, AdvancementContext>} */
    const advs = {};
    /** @type {BaseAdvancement[]} */
    const models = this.item.getEmbeddedCollection("Advancement")[
      this.isPlayMode ? "contents" : "sourceContents"
    ].sort((a, b) => a.sort - b.sort);
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
      const modelContext = {
        name: model.name,
        img: model.img,
        sort: model.sort,
        id: model.id,
        canReconfigure: model.canReconfigure,
      };
      if (model.description) modelContext.enrichedDescription = await enrichHTML(model.description, { relativeTo: this.item });
      advs[model.requirements.level].documents.push(modelContext);
    }

    return Object.values(advs).sort((a, b) => (a.level - b.level));
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

      if (this._expandedDocumentDescriptions.has(e.uuid)) {
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

    // General right click on row
    this._createContextMenu(this._getDocumentListContextOptions, "[data-document-uuid]", {
      hookName: "getDocumentListContextOptions",
      parentClassHooks: false,
      fixed: true,
    });

    // Same menu but for the specific vertical ellipsis control
    this._createContextMenu(this._getDocumentListContextOptions, "[data-action=\"documentListContext\"]", {
      hookName: "getDocumentListContextOptions",
      parentClassHooks: false,
      fixed: true,
      eventName: "click",
    });

    this._createContextMenu(this._createEffectContextOptions, ".effect-list-container .effect-create", {
      hookName: "createEffectContextOptions",
      parentClassHooks: false,
      fixed: true,
      eventName: "click",
    });
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for embedded document lists.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getDocumentListContextOptions() {
    return [
      {
        name: "DRAW_STEEL.ActiveEffect.RollSave",
        icon: "<i class=\"fa-solid fa-fw fa-dice-d10\"></i>",
        condition: (target) => {
          const effect = this._getEmbeddedDocument(target);
          return effect.system.end?.type === "save";
        },
        callback: async (target) => {
          const effect = this._getEmbeddedDocument(target);
          await effect.system.rollSave();
        },
      },
      {
        name: "DRAW_STEEL.ActiveEffect.Toggle",
        icon: "<i class=\"fa-solid fa-fw fa-check\"></i>",
        condition: (target) => {
          const effect = this._getEmbeddedDocument(target);
          return !effect.active;
        },
        callback: async (target) => {
          const effect = this._getEmbeddedDocument(target);
          const updateData = DrawSteelActiveEffect.getInitialDuration();

          updateData.disabled = false;

          await effect.update(updateData);
        },
      },
      {
        name: "DRAW_STEEL.ActiveEffect.Toggle",
        icon: "<i class=\"fa-solid fa-fw fa-times\"></i>",
        condition: (target) => {
          const effect = this._getEmbeddedDocument(target);
          return effect.active;
        },
        callback: async (target) => {
          const effect = this._getEmbeddedDocument(target);
          await effect.update({ disabled: true });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.View",
        icon: "<i class=\"fa-solid fa-fw fa-eye\"></i>",
        condition: () => this.isPlayMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        condition: () => this.isEditMode,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await document.sheet.render({ force: true });
        },
      },
      {
        name: "DRAW_STEEL.SHEET.Share",
        icon: "<i class=\"fa-solid fa-fw fa-share-from-square\"></i>",
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          await DrawSteelChatMessage.create({
            content: `@Embed[${document.uuid} caption=false]`,
            speaker: DrawSteelChatMessage.getSpeaker({ actor: this.item.actor }),
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
        condition: () => this.item.isOwner,
        callback: async (target) => {
          const document = this._getEmbeddedDocument(target);
          document.deleteDialog();
        },
      },
    ];
  }

  /**
   * Get context menu entries for creating Active Effects.
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
            img: this.item.img,
            type: "base",
            // if item is unowned this is just the item's UUID
            origin: foundry.utils.parseUuid(this.item.uuid, { relative: this.item.actor }).uuid,
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
            img: this.item.img,
            type: "abilityModifier",
            // if item is unowned this is just the item's UUID
            origin: foundry.utils.parseUuid(this.item.uuid, { relative: this.item.actor }).uuid,
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
   * Whether this item can be updated from a compendium source.
   *
   * @this DrawSteelItemSheet
   */
  static #canUpdateFromCompendium() {
    const sourceDoc = !!fromUuidSync(this.document._stats.compendiumSource, { strict: false });
    return sourceDoc && game.user.canUpdateFromCompendium();
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
    new DocumentSourceInput({ document: this.item }).render({ force: true });
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
        highlightDocumentMatches: ProseMirror.ProseMirrorHighlightMatchesPlugin.build(ProseMirror.defaultSchema, {
          onSave: this.#saveEditor.bind(this),
        }),
      },
    });
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
    const context = BaseAdvancement._prepareCreateDialogContext(this.item);

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
    ds.data.pseudoDocuments.advancements.SkillAdvancement.create(createData, { parent: this.item });
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
    if (!this.item.parent) throw new Error("You can only reconfigure advancements if the item is embedded in an actor");
    const advancement = this._getPseudoDocument(target);
    await advancement.reconfigure();
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropActiveEffect(event, effect) {
    if (!this.item.isOwner || !effect) return false;

    if (this.item.uuid === effect.parent?.uuid) {
      const result = await this._onSortActiveEffect(event, effect);
      return result?.length ? effect : null;
    }
    const keepId = !this.item.effects.has(effect.id);
    const effectData = game.items.fromCompendium(effect);
    const result = await ActiveEffect.implementation.create(effectData, { parent: this.item, keepId });
    return result ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings.
   *
   * @param {DragEvent} event       The initiating drop event.
   * @param {DrawSteelActiveEffect} effect   The dropped ActiveEffect document.
   * @returns {Promise<DrawSteelActiveEffect[]>|void}
   * @protected
   */
  async _onSortActiveEffect(event, effect) {
    const dropTarget = event.target.closest("[data-document-uuid]");
    if (!dropTarget) return null;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.id === target.id) return null;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const sibling = this._getEmbeddedDocument(el);
      if (sibling.uuid !== effect.uuid) siblings.push(sibling);
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

  /** @inheritdoc */
  async _onDropPseudoDocument(event, pseudo) {
    if (!this.item.pseudoCollections[pseudo.documentName]) return;
    switch (pseudo.documentName) {
      case "Advancement":
        return (await this._onDropAdvancement(event, pseudo)) ?? null;
      case "PowerRollEffect":
        return (await this._onDropPowerRollEffect(event, pseudo)) ?? null;
    }
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a dropped Advancement.
   * @param {DragEvent} event             The initiating drop event.
   * @param {BaseAdvancement} advancement The dropped Advancement.
   * @returns {Promise<BaseAdvancement|null>} A Promise resolving to the dropped Advancement (if sorting), a newly created Advancement,
   *                                         or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropAdvancement(event, advancement) {
    if (!this.item.isOwner || !advancement) return null;

    if (!ds.CONFIG.Advancement[advancement.type].itemTypes.has(this.item.type)) {
      ui.notifications.error("DRAW_STEEL.ADVANCEMENT.SHEET.warnDrop", { format: {
        itemType: game.i18n.localize(CONFIG.Item.typeLabels[this.item.type]),
        advancementType: game.i18n.localize(ds.CONFIG.Advancement[advancement.type].label),
      } });
      return null;
    }

    if (this.item.uuid === advancement.document?.uuid) {
      const result = await this._onSortPseudoDocument(event, advancement);
      return result?.length ? advancement : null;
    }

    const keepId = !this.item.getEmbeddedCollection("Advancement").has(advancement.id);
    const advancementData = advancement.toObject();

    const result = await BaseAdvancement.create(advancementData, { keepId, parent: this.item, renderSheet: false });

    return result ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a dropped PowerRollEffect.
   * @param {DragEvent} event             The initiating drop event.
   * @param {BasePowerRollEffect} effect  The dropped PowerRollEffect.
   * @returns {Promise<BasePowerRollEffect|null>} A Promise resolving to the dropped PowerRollEffect (if sorting), a newly created PowerRollEffect,
   *                                         or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropPowerRollEffect(event, effect) {
    if (!this.item.isOwner || !effect) return null;

    if (this.item.uuid === effect.document?.uuid) {
      const result = await this._onSortPseudoDocument(event, effect);
      return result?.length ? effect : null;
    }

    const keepId = !this.item.getEmbeddedCollection("PowerRollEffect").has(effect.id);
    const effectData = effect.toObject();

    const result = await BasePowerRollEffect.create(effectData, { keepId, parent: this.item, renderSheet: false });

    return result ?? null;
  }

  /**
   * Handle a drop event for an existing embedded PseudoDocument to sort that PseudoDocument relative to its siblings.
   *
   * @param {DragEvent} event       The initiating drop event.
   * @param {PseudoDocument} pseudo   The dropped PseudoDocument.
   * @returns {Promise<PseudoDocument[]>|void}
   * @protected
   */
  _onSortPseudoDocument(event, pseudo) {
    const dropTarget = event.target.closest("[data-pseudo-id]");
    if (!dropTarget) return null;
    const target = this._getPseudoDocument(dropTarget);

    // Don't sort on yourself
    if (pseudo.id === target.id) return null;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      if (!el.dataset?.pseudoId) continue;
      const sibling = this._getPseudoDocument(el);
      if (sibling.id !== pseudo.id) siblings.push(sibling);
    }

    // Perform the sort
    const sortUpdates = foundry.utils.performIntegerSort(pseudo, {
      target,
      siblings,
    });
    const updateData = sortUpdates.reduce((update, obj) => {
      update[obj.target.id] = obj.update;
      return update;
    }, {});

    return this.item.update({ [pseudo.fieldPath]: updateData });
  }
}
