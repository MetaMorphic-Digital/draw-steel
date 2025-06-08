import { systemPath } from "../../constants.mjs";

const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

/**
 * A reusable document sheet that performs live updates of provided fields.
 * Construction requires passing a `contentFunc` method that constructs the inner HTML.
 */
export default class DocumentInput extends HandlebarsApplicationMixin(DocumentSheet) {
  static DEFAULT_OPTIONS = {
    contentFunc: null,
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
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.localize(this.options.window.title) || super.title;
  }

  /* -------------------------------------------------- */

  /**
   * A function that assembles the HTML content to display.
   * It is acceptable for `this` to be bound to something other than the DocumentInput sheet.
   * @type {() => Promise<string>}
   */
  get contentFunc() {
    if (!(this.options.contentFunc instanceof Function)) console.error("You must pass a contentFunc");
    return this.options.contentFunc;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return {
      content: await this.contentFunc(),
    };
  }
}
