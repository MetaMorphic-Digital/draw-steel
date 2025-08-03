import { systemPath } from "../../constants.mjs";

/**
 * The Application responsible for configuring a single ActiveEffect document within a parent Actor or Item.
 */
export default class DrawSteelActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: "templates/sheets/active-effect/header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    details: {
      template: systemPath("templates/sheets/active-effect/details.hbs"),
    },
    duration: {
      template: systemPath("templates/sheets/active-effect/config-duration.hbs"),
    },
    changes: {
      template: "templates/sheets/active-effect/changes.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.document.system.schema.fields;

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);

    switch (partId) {
      case "details":
        context.keywordOptions = ds.CONFIG.abilities.keywords.optgroups;
        break;
    }

    return partContext;
  }
}
