const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

/**
 * A reusable document sheet that performs live updates of provided fields.
 * @abstract
 */
export default class DocumentInput extends HandlebarsApplicationMixin(DocumentSheet) {
  static DEFAULT_OPTIONS = {
    sheetConfig: false,
    classes: ["draw-steel"],
    form: {
      submitOnChange: true,
    },
    position: {
      width: 400,
      height: "auto",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.localize(this.options.window.title) || super.title;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.system = this.document.system;

    context.systemSource = this.document.system._source;

    context.systemFields = this.document.system.schema.fields;

    return context;
  }
}
