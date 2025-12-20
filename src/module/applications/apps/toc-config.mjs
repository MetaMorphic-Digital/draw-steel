import { systemID, systemPath } from "../../constants.mjs";
import DSApplication from "../api/application.mjs";

/**
 * @import { ApplicationRenderOptions } from "@client/applications/_types.mjs"
 */

/**
 * Application for configuring which documents appear in the Table of Contents.
 */
export default class CompendiumTOCConfig extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["standard-form"],
    compendium: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/apps/toc-config/header.hbs"),
    },
    body: {
      template: systemPath("templates/apps/toc-config/body.hbs"),
    },
    footer: {
      // Foundry-provided generic template
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * The compendium being configured.
   * @type {foundry.documents.collections.CompendiumCollection}
   */
  get compendium() {
    return this.options.compendium;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.COMPENDIUM.TOC.configure.title", { title: game.i18n.localize(this.compendium.title) });
  }
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "header":
        break;
      case "body":
        this._prepareBodyContext(context, options);
        break;
      case "footer":
        context.buttons = [{ type: "submit", icon: "fa-solid fa-check", label: "DRAW_STEEL.COMPENDIUM.TOC.configure.submit" }];
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Helper function to prepare the body context.
   * @param {object} context
   * @param {ApplicationRenderOptions} options
   */
  async _prepareBodyContext(context, options) {
    context.collection = this.compendium.contents.sort((a, b) => a.sort - b.sort);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions) {
    const fd = super._processFormData(event, form, formData, submitOptions);

    const updateData = [];

    for (const [_id, data] of Object.entries(fd)) {
      updateData.push({ _id, [`flags.${systemID}`]: data });
    }

    return updateData;
  }
}
