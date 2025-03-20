import { systemPath } from "../../constants.mjs";

/** @import {FormFooterButton} from "../../../../foundry/client-esm/applications/_types.mjs" */

const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;

/**
 * Basic sheet for Combatant Groups
 */
export default class DrawSteelCombatantGroupConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "combatant-group-config", "standard-form"],
    position: { width: 420 },
    actions: {
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/combat/group-config/header.hbs"),
    },
    body: {
      template: systemPath("templates/combat/group-config/body.hbs"),
    },
    footer: {
      // Core template
      template: "templates/generic/form-footer.hbs",
    },
  };

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const systemModel = this.document.system;
    return Object.assign(context, {
      system: systemModel,
      systemFields: systemModel.schema.fields,
    });
  }

  /** @inheritdoc */
  async _preparePartContext(partId, context, option) {
    context = await super._preparePartContext(partId, context, option);
    switch (partId) {
      case "body": this._prepareBodyContext(context); break;
      case "footer": this._prepareFooterContext(context); break;
    }
    return context;
  }

  _prepareBodyContext(context) {}

  _prepareFooterContext(context) {
    /** @type {FormFooterButton[]} */
    const buttons = [
      {
        type: "submit",
        label: game.i18n.format("DOCUMENT.Update", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "fa-solid fa-save",
      },
    ];

    context.buttons = buttons;
  }
}
