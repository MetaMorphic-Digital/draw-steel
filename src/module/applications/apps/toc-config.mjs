import { systemID, systemPath } from "../../constants.mjs";
import DSApplication from "../api/application.mjs";
import DrawSteelCompendiumTOC from "../sidebar/apps/table-of-contents.mjs";

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
    context.entries = this.compendium.contents.sort((a, b) => a.sort - b.sort).map((doc, index) => ({
      document: doc,
      type: doc.getFlag(systemID, "table-of-contents.type") ?? "chapter",
      showPages: doc.getFlag(systemID, "table-of-contents.showPages") ?? true,
      position: doc.getFlag(systemID, "table-of-contents.position") ?? index,
      title: doc.getFlag(systemID, "table-of-contents.title"),
    }));

    context.entryTypes = Object.entries(DrawSteelCompendiumTOC.ENTRY_TYPES).map(([value, { label }]) => ({ value, label }));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions) {
    const fd = super._processFormData(event, form, formData, submitOptions);

    const updateData = [];

    for (const [_id, data] of Object.entries(fd)) {
      updateData.push({ _id, [`flags.${systemID}.table-of-contents`]: data });
    }

    return updateData;
  }
}
