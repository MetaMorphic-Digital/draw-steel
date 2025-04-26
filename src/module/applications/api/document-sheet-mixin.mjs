const { HandlebarsApplicationMixin } = foundry.applications.api;

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
        flags: this.document.flags,
        config: ds.CONFIG,
        systemFields: this.document.system.schema.fields,
      });
      return context;
    }
  };
};
