import { systemPath } from "../../../constants.mjs";

/**
 * @import { ConfigContextEntry } from "./_types";
 */

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
    languages: {
      template: systemPath("templates/sheets/journal/pages/config/languages.hbs"),
      scrollable: [".scrollable"],
    },
    monsterKeywords: {
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

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "languages":
      case "monsterKeywords":
        context[partId] = this._prepareConfigArray(partId);
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Construct iterable with relevant data for each entry in the array.
   * @param {string} partId
   * @returns {Array<ConfigContextEntry>}
   */
  _prepareConfigArray(partId) {
    const fields = this.document.system.schema.getField(partId).element.fields;

    let config;

    switch (partId) {
      case "languages":
        config = ds.CONFIG.languages;
        break;
      case "monsterKeywords":
        config = ds.CONFIG.monsters.keywords;
        break;
    }

    return this.document.system[partId].map((values, index) => {

      const keyPlaceholder = values.label.slugify({ strict: true });

      const entry = { fields, values, keyPlaceholder };

      entry.names = Object.keys(values).reduce((names, key) => {
        names[key] = `system.${partId}.${index}.${key}`;
        return names;
      }, {});

      const effectiveKey = values.key || keyPlaceholder;

      if ((effectiveKey in config) && (config[effectiveKey].source !== this.document.uuid)) {
        entry.warnDuplicateKey = true;
      }

      return entry;
    });
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
