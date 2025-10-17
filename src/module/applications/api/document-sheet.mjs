import constructHTMLButton from "../../utils/construct-html-button.mjs";
import PseudoDocument from "../../data/pseudo-documents/pseudo-document.mjs";

/**
 * @import { DragDrop } from "@client/applications/ux/_module.mjs";
 * @import { Document } from "@common/abstract/_module.mjs";
 * @import { DrawSteelActiveEffect, DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 */

const { api, ux } = foundry.applications;

/**
 * Augments a Document Sheet with Draw-Steel specific behavior.
 * This includes drag and drop, play/edit mode, and PseudoDocument support.
 */
export default class DSDocumentSheet extends api.HandlebarsApplicationMixin(api.DocumentSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      resizable: true,
    },
    actions: {
      toggleMode: DSDocumentSheet.#toggleMode,
      viewDoc: DSDocumentSheet.#viewDoc,
      createDoc: DSDocumentSheet.#createDoc,
      deleteDoc: DSDocumentSheet.#deleteDoc,
      createPseudoDocument: DSDocumentSheet.#createPseudoDocument,
      deletePseudoDocument: DSDocumentSheet.#deletePseudoDocument,
      renderPseudoDocumentSheet: DSDocumentSheet.#renderPseudoDocumentSheet,
      toggleDocumentDescription: DSDocumentSheet.#toggleDocumentDescription,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: ".draggable" }],
  };

  /* -------------------------------------------------- */

  /**
   * Available sheet modes.
   */
  static MODES = Object.freeze({
    PLAY: 1,
    EDIT: 2,
  });

  /* -------------------------------------------------- */

  /**
   * The mode the sheet is currently in.
   * @type {typeof DSDocumentSheet.MODES[keyof typeof DSDocumentSheet.MODES]}
   * @protected
   */
  _mode = DSDocumentSheet.MODES.PLAY;

  /* -------------------------------------------------- */

  /**
   * Is this sheet in Play Mode?
   * @returns {boolean}
   */
  get isPlayMode() {
    return this._mode === DSDocumentSheet.MODES.PLAY;
  }

  /* -------------------------------------------------- */

  /**
   * Is this sheet in Edit Mode?
   * @returns {boolean}
   */
  get isEditMode() {
    return this._mode === DSDocumentSheet.MODES.EDIT;
  }

  /* -------------------------------------------------- */

  /**
   * A set of the currently expanded document uuids.
   * @type {Set<string>}
   */
  _expandedDocumentDescriptions = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.mode && this.isEditable) this._mode = options.mode;
    // New sheets should always start in edit mode
    else if (options.renderContext === `create${this.document.documentName}`) this._mode = DSDocumentSheet.MODES.EDIT;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const buttons = [constructHTMLButton({
      label: "",
      classes: ["header-control", "icon", "fa-solid", "fa-user-lock"],
      dataset: { action: "toggleMode", tooltip: "DRAW_STEEL.SHEET.ToggleMode" },
    })];

    if (this.document.system.source) {
      buttons.push(constructHTMLButton({
        label: "",
        classes: ["header-control", "icon", "fa-solid", "fa-book"],
        dataset: { action: "updateSource", tooltip: "DRAW_STEEL.SOURCE.Update" },
      }));
    }
    this.window.controls.after(...buttons);

    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      isPlay: this.isPlayMode,
      owner: this.document.isOwner,
      limited: this.document.limited,
      gm: game.user.isGM,
      document: this.document,
      system: this.document.system,
      systemSource: this.document.system._source,
      systemFields: this.document.system.schema.fields,
      flags: this.document.flags,
      config: ds.CONFIG,
    });
    return context;
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#dragDrop.forEach((d) => d.bind(this.element));
  }

  /* -------------------------------------------------- */
  /*   Actions                                        */
  /* -------------------------------------------------- */

  /**
   * Toggle Edit vs. Play mode.
   *
   * @this DSDocumentSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #toggleMode(event, target) {
    if (!this.isEditable) {
      console.error("You can't switch to Edit mode if the sheet is uneditable.");
      return;
    }
    await this.render({ mode: this.isPlayMode ? DSDocumentSheet.MODES.EDIT : DSDocumentSheet.MODES.PLAY });
  }

  /* -------------------------------------------------- */

  /**
   * Renders an embedded document's sheet in play or edit mode based on the document sheet view mode.
   *
   * @this DSDocumentSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static #viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render({ force: true, mode: this._mode });
  }

  /* -------------------------------------------------- */

  /**
   * Handles document deletion.
   *
   * @this DSDocumentSheet
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
   * Handle creating a new embedded document using initial data defined in the HTML dataset.
   *
   * @this DSDocumentSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #createDoc(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass);
    const docData = {
      name: docCls.defaultName({ type: target.dataset.type, parent: this.document }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (["action", "documentClass", "renderSheet"].includes(dataKey)) continue;
      // Nested properties use dot notation like `data-system.prop`
      foundry.utils.setProperty(docData, dataKey, value);
    }

    await docCls.create(docData, { parent: this.document, renderSheet: target.dataset.renderSheet });
  }

  /* -------------------------------------------------- */
  /*   Helper Functions                               */
  /* -------------------------------------------------- */

  /**
   * Fetches the embedded document representing the containing HTML element.
   *
   * @param {HTMLElement} target    The element subject to search.
   * @returns {Document} The embedded document.
   */
  _getEmbeddedDocument(target) {
    const documentUuid = target.closest("[data-document-uuid]").dataset.documentUuid;

    // fromUuidSync doesn't allow  retrieving embedded compendium documents, so manually retrieving each child document from the base document.
    const { collection, embedded, documentId } = foundry.utils.parseUuid(documentUuid);
    let document = collection.get(documentId);
    while (document && (embedded.length > 1)) {
      const [embeddedName, embeddedId] = embedded.splice(0, 2);
      document = document.getEmbeddedDocument(embeddedName, embeddedId);
    }

    return document;
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the document embed between visible and hidden.
   * @this DSDocumentSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #toggleDocumentDescription(event, target) {
    const parentElement = target.closest(".expandable-document");
    const toggleIcon = parentElement.querySelector("a[data-action=\"toggleDocumentDescription\"]");
    const { documentUuid } = parentElement.dataset;
    const embedContainer = parentElement.querySelector(".document-description");
    const isExpanded = this._expandedDocumentDescriptions.has(documentUuid);

    if (isExpanded) this._expandedDocumentDescriptions.delete(documentUuid);
    else {
      // Only generate the embed HTML once.
      if (!embedContainer.innerHTML.trim()) {
        const document = this._getEmbeddedDocument(parentElement);
        const embed = await document?.system?.toEmbed({ includeName: false });
        if (embed) embedContainer.innerHTML = embed.outerHTML;
      }
      this._expandedDocumentDescriptions.add(documentUuid);
    }

    // Force toggle html classes
    toggleIcon.classList.toggle("fa-angle-down", !isExpanded);
    toggleIcon.classList.toggle("fa-angle-right", isExpanded);
    embedContainer.classList.toggle("expanded", !isExpanded);
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to retrieve an embedded pseudo-document.
   * @param {HTMLElement} element   The element with relevant data.
   * @returns {PseudoDocument}
   */
  _getPseudoDocument(element) {
    const documentName = element.closest("[data-pseudo-document-name]").dataset.pseudoDocumentName;
    const id = element.closest("[data-pseudo-id]").dataset.pseudoId;
    return this.document.getEmbeddedDocument(documentName, id);
  }

  /* -------------------------------------------------- */

  /**
   * Create a pseudo-document.
   * @this DSDocumentSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #createPseudoDocument(event, target) {
    const documentName = target.closest("[data-pseudo-document-name]").dataset.pseudoDocumentName;
    const type = target.closest("[data-pseudo-type]")?.dataset.pseudoType;
    const Cls = this.document.getEmbeddedCollection(documentName).documentClass;

    if (!type && (foundry.utils.isSubclass(Cls, ds.data.pseudoDocuments.TypedPseudoDocument))) {
      Cls.createDialog({}, { parent: this.document });
    } else {
      Cls.create({ type }, { parent: this.document });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Delete a pseudo-document.
   * @this DSDocumentSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #deletePseudoDocument(event, target) {
    const doc = this._getPseudoDocument(target);
    doc.delete();
  }

  /* -------------------------------------------------- */

  /**
   * Render the sheet of a pseudo-document.
   * @this DSDocumentSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #renderPseudoDocumentSheet(event, target) {
    const doc = this._getPseudoDocument(target);
    doc.sheet.render({ force: true });
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                  */
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

  /* -------------------------------------------------- */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector.
   * @param {string} selector       The candidate HTML selector for dragging.
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector.
   * @param {string} selector       The candidate HTML selector for the drop target.
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event.
   * @protected
   */
  async _onDragStart(event) {
    const target = event.currentTarget;
    if ("link" in event.target.dataset) return;
    let dragData;

    if (target.dataset.documentUuid) {
      const document = this._getEmbeddedDocument(target);
      dragData = document.toDragData();
    }

    if (target.dataset.pseudoId) {
      const pseudo = this._getPseudoDocument(target);
      dragData = pseudo.toDragData();
    }

    // Set data transfer
    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {}

  /* -------------------------------------------- */

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @protected
   */
  async _onDrop(event) {
    if (!this.isEditable) return;
    const data = ux.TextEditor.implementation.getDragEventData(event);
    const allowed = Hooks.call(`drop${this.document.documentName}SheetData`, this.document, this, data);
    if (allowed === false) return false;

    // Dropped Documents
    const documentClass = foundry.utils.getDocumentClass(data.type);
    if (documentClass) {
      const document = await documentClass.fromDropData(data);
      return this._onDropDocument(event, document);
    }

    // TODO: Add drag and drop for PseudoDocuments
    const pseudoClass = ds.utils.ModelCollection.documentClasses[data.type];
    if (pseudoClass) {
      const pseudo = await pseudoClass.fromDropData(data);
      return this._onDropPseudoDocument(event, pseudo);
    }

    return data;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped document on the Document Sheet.
   * @template {Document} TDocument
   * @param {DragEvent} event           The initiating drop event.
   * @param {TDocument} document        The resolved Document instance.
   * @returns {Promise<TDocument|null>} A Document of the same type as the dropped one in case of a successful result,
   *                                    or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropDocument(event, document) {
    switch (document.documentName) {
      case "ActiveEffect":
        return (await this._onDropActiveEffect(event, document)) ?? null;
      case "Actor":
        return (await this._onDropActor(event, document)) ?? null;
      case "Item":
        return (await this._onDropItem(event, document)) ?? null;
      case "Folder":
        return (await this._onDropFolder(event, document)) ?? null;
      default:
        return null;
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Active Effect.
   * @param {DragEvent} event       The initiating drop event.
   * @param {DrawSteelActiveEffect} effect   The dropped ActiveEffect document.
   * @returns {Promise<DrawSteelActiveEffect|null>} A Promise resolving to the dropped ActiveEffect (if sorting), a newly created ActiveEffect,
   *                                         or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropActiveEffect(event, effect) {
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Actor.
   * @param {DragEvent} event       The initiating drop event.
   * @param {DrawSteelActor} actor  The dropped Actor document.
   * @returns {Promise<DrawSteelActor|null>} A Promise resolving to the dropped Actor (if sorting), a newly created Actor,
   *                                         or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropActor(event, actor) {
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Item.
   * @param {DragEvent} event     The initiating drop event.
   * @param {DrawSteelItem} item  The dropped Item document.
   * @returns {Promise<DrawSteelItem|null>} A Promise resolving to the dropped Item (if sorting), a newly created Item,
   *                                         or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropItem(event, item) {
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped Folder.
   * @param {DragEvent} event                   The initiating drop event.
   * @param {foundry.documents.Folder} folder   The dropped Folder document.
   * @returns {Promise<foundry.documents.Folder|null>} A Promise resolving to the dropped Folder indicate success,
   *                                            or null to indicate failure or no action being taken.
   * @protected
   */
  async _onDropFolder(event, folder) {
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Handle a dropped PseudoDocument on the Document Sheet.
   * @template {PseudoDocument} TDocument
   * @param {DragEvent} event           The initiating drop event.
   * @param {TDocument} pseudo          The resolved PseudoDocument instance.
   * @returns {Promise<TDocument|null>} A PseudoDocument of the same type as the dropped one in case of a successful result,
   *                                    or null in case of failure or no action being taken.
   * @protected
   */
  async _onDropPseudoDocument(event, pseudo) {
    return null;
  }
}
