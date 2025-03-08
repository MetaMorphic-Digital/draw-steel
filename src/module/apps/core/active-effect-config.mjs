import {systemPath} from "../../constants.mjs";

/**
 * The Application responsible for configuring a single ActiveEffect document within a parent Actor or Item.
 */
export default class DrawSteelActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"]
  };

  /** @override */
  static PARTS = {
    header: {
      template: "templates/sheets/active-effect-config/header.hbs"
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    details: {
      template: "templates/sheets/active-effect-config/details.hbs"
    },
    duration: {
      template: systemPath("templates/active-effect/config-duration.hbs")
    },
    changes: {
      template: "templates/sheets/active-effect-config/changes.hbs"
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.document.system.schema.fields;
    context.durationOptions = Object.entries(ds.CONFIG.effectEnds).map(([value, {label}]) => ({value, label}));

    return context;
  }
}
