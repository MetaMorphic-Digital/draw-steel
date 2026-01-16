import { systemPath } from "../../../constants.mjs";

/**
 * A page allowing easy configuration of certain registry entries.
 */
export default class ConfigPage extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "config"],
    actions: {
      addEntry: this.#addEntry,
      removeEntry: this.#removeEntry,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "languages" },
        { id: "monsterKeywords" },
      ],
      initial: "languages",
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
      template: systemPath("templates/sheets/journal/pages/config/languages.hbs"),
      scrollable: [".scrollable"],
    },
    tooltip: {
      template: systemPath("templates/sheets/journal/pages/config/monster-keywords.hbs"),
      scrollable: [".scrollable"],
    },
    footer: super.EDIT_PARTS.footer,
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.page.system.schema.fields;
    context.system = this.page.system;
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Add a new config entry.
   *
   * @this ConfigPage
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #addEntry(event, target) {
    const { path } = target.dataset;
    const newEntry = { label: "", key: "" };

    return this.document.update({ [`system.${path}`]: this.document.system[path].concat(newEntry) });
  }
  /* -------------------------------------------------- */

  /**
   * Remove an existing config entry.
   *
   * @this ConfigPage
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #removeEntry(event, target) {
    const { path, index } = target.dataset;

    const updatedArray = this.document.system[path].splice(index, 1);

    return this.document.update({ [`system.${path}`]: updatedArray });
  }
}
