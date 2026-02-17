import { systemPath } from "../../../constants.mjs";

export default class DrawSteelImageSheet extends foundry.applications.sheets.journal.JournalEntryPageImageSheet {
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    content: {
      template: systemPath("templates/sheets/journal/pages/image/edit.hbs"),
      classes: ["standard-form", "scrollable"],
      scrollable: [""],
    },
    footer: super.EDIT_PARTS.footer,
  };

  /* -------------------------------------------------- */

  /** @override */
  static VIEW_PARTS = {
    content: {
      template: systemPath("templates/sheets/journal/pages/image/view.hbs"),
      root: true,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.page.system.schema.fields;
    context.system = this.page.system;
    return context;
  }
}
