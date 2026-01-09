import { systemPath } from "../../../constants.mjs";

/**
 * An application responsible for displaying a journal entry page with type "reference".
 */
export default class ReferencePage extends foundry.applications.sheets.journal.JournalEntryPageProseMirrorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "content" },
        { id: "tooltip" },
      ],
      initial: "content",
      labelPrefix: "DRAW_STEEL.JournalEntryPage.Tabs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    content: {
      template: systemPath("templates/sheets/journal/pages/reference/content-edit.hbs"),
    },
    tooltip: {
      template: systemPath("templates/sheets/journal/pages/reference/tooltip-edit.hbs"),
    },
    footer: super.EDIT_PARTS.footer,
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "tooltip": await this._prepareTooltipTabContext(context, options);
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareTooltipTabContext(context, options) {
    context.system = this.document.system;
    context.systemFields = this.document.system.schema.fields;
  }
}
