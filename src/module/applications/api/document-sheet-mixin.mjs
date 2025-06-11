import constructHTMLButton from "../../utils/construct-html-button.mjs";

/** @import { Constructor } from "@common/_types.mjs" */

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Augments a Document Sheet with Draw-Steel specific behavior
 * @template {Constructor<foundry.applications.api.DocumentSheet>} BaseDocumentSheet
 * @param {BaseDocumentSheet} base
 */
export default base => {
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
    };

    /* -------------------------------------------------- */

    /**
     * Available sheet modes.
     * @enum {number}
     */
    static MODES = Object.freeze({
      PLAY: 1,
      EDIT: 2,
    });

    /* -------------------------------------------------- */

    /**
     * The mode the sheet is currently in.
     * @type {DSDocumentSheet.MODES}
     */
    _mode;

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

    /** @inheritdoc */
    _configureRenderOptions(options) {
      super._configureRenderOptions(options);
      if (options.mode && this.isEditable) this._mode = options.mode;
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    async _renderFrame(options) {
      const frame = await super._renderFrame(options);
      const buttons = [constructHTMLButton({ label: "", classes: ["header-control", "icon", "fa-solid", "fa-user-lock"], dataset: { action: "toggleMode", tooltip: "DRAW_STEEL.Sheet.ToggleMode" } })];

      if (this.document.system.source) {
        buttons.push(constructHTMLButton({ label: "", classes: ["header-control", "icon", "fa-solid", "fa-book"], dataset: { action: "updateSource", tooltip: "DRAW_STEEL.Sheet.UpdateSource" } }));
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

    /**
     * Prepare context data for a data field.
     * @param {string} path             The path to the given field, relative to the root of the document.
     * @param {object} [additions={}]   Additional properties to add to the field.
     * @returns {object}
     */
    _prepareField(path, additions = {}) {
      const value = foundry.utils.getProperty(this.isPlayMode ? this.document : this.document._source, path);
      const field = path.startsWith("system")
        ? this.document.system.schema.getField(path.slice(7))
        : this.document.schema.getField(path);
      return { value, field, ...additions };
    }
  };
};
