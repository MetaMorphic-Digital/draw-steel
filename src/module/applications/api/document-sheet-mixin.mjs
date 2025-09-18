import constructHTMLButton from "../../utils/construct-html-button.mjs";

/** @import { Constructor } from "@common/_types.mjs" */
/** @import { Document } from "@common/abstract/_module.mjs" */

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Augments a Document Sheet with Draw-Steel specific behavior.
 * @template {Constructor<foundry.applications.api.DocumentSheet>} BaseDocumentSheet
 * @param {BaseDocumentSheet} base
 */
export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class DSDocumentSheet extends HandlebarsApplicationMixin(base) {
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
        createPseudoDocument: DSDocumentSheet.#createPseudoDocument,
        deletePseudoDocument: DSDocumentSheet.#deletePseudoDocument,
        renderPseudoDocumentSheet: DSDocumentSheet.#renderPseudoDocumentSheet,
        toggleDocumentEmbed: DSDocumentSheet.#toggleDocumentEmbed,
      },
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
     * A set of the currently expanded document ids.
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

    /* -------------------------------------------------- */
    /*   Helper Functions                                 */
    /* -------------------------------------------------- */

    /**
     * Fetches the embedded document representing the containing HTML element.
     *
     * @param {HTMLElement} target    The element subject to search.
     * @returns {Document} The embedded document
     */
    _getEmbeddedDocument(target) {
      const parentUuid = target.closest("[data-parent-uuid]").dataset.parentUuid;
      const documentClass = target.closest("[data-document-class]").dataset.documentClass;
      const documentId = target.closest("[data-document-id").dataset.documentId;
      const parentDocument = fromUuidSync(parentUuid);

      return parentDocument.getEmbeddedDocument(documentClass, documentId);
    }

    /* -------------------------------------------------- */

    /**
     * Toggle the document embed between visible and hidden.
     * @this DSDocumentSheet
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     * @protected
     */
    static async #toggleDocumentEmbed(event, target) {
      const parentElement = target.closest(".expandable-document");
      const toggleIcon = parentElement.querySelector("a[data-action=\"toggleDocumentEmbed\"]");
      const { documentId } = parentElement.dataset;
      const embedContainer = parentElement.querySelector(".document-description");
      const isExpanded = this._expandedDocumentDescriptions.has(documentId);

      if (isExpanded) this._expandedDocumentDescriptions.delete(documentId);
      else {
        // Only generate the embed HTML once.
        if (!embedContainer.innerHTML.trim()) {
          const document = this._getEmbeddedDocument(parentElement);
          const embed = await document?.system?.toEmbed({});
          if (embed) embedContainer.innerHTML = embed.outerHTML;
        }
        this._expandedDocumentDescriptions.add(documentId);
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
     * @returns {ds.data.pseudoDocuments.PseudoDocument}
     */
    _getPseudoDocument(element) {
      const documentName = element.closest("[data-pseudo-document-name]").dataset.pseudoDocumentName;
      const id = element.closest("[data-pseudo-id]").dataset.pseudoId;
      return this.document.getEmbeddedDocument(documentName, id);
    }

    /* -------------------------------------------------- */

    /**
     * Create a pseudo-document.
     * @this {DSDocumentSheet}
     * @param {PointerEvent} event    The initiating click event.
     * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
     */
    static #createPseudoDocument(event, target) {
      const documentName = target.closest("[data-pseudo-document-name]").dataset.pseudoDocumentName;
      const type = target.closest("[data-pseudo-type]")?.dataset.pseudoType;
      const Cls = this.document.getEmbeddedPseudoDocumentCollection(documentName).documentClass;

      if (!type && (foundry.utils.isSubclass(Cls, ds.data.pseudoDocuments.TypedPseudoDocument))) {
        Cls.createDialog({}, { parent: this.document });
      } else {
        Cls.create({ type }, { parent: this.document });
      }
    }

    /* -------------------------------------------------- */

    /**
     * Delete a pseudo-document.
     * @this {DSDocumentSheet}
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
     * @this {DSDocumentSheet}
     * @param {PointerEvent} event    The initiating click event.
     * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
     */
    static #renderPseudoDocumentSheet(event, target) {
      const doc = this._getPseudoDocument(target);
      doc.sheet.render({ force: true });
    }
  };
};
