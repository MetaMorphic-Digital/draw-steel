import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";
import { systemPath } from "../../../constants.mjs";

export default class SpecialEffectSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["special-effect"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    details: {
      template: systemPath("templates/sheets/pseudo-documents/special-effect/content.hbs"),
      // Modules can push to this or otherwise load their details partial templates
      templates: ["persistent.hbs", "spend.hbs"].map(t => systemPath(`templates/sheets/pseudo-documents/special-effect/${t}`)),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "details":
        return this.#prepareDetailsContext(context, options);
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the details tab.
   * @param {object} context    Rendering context.
   * @returns {Promise<object>}     Mutated rendering context.
   */
  async #prepareDetailsContext(context, options) {
    context.detailsPartial = this.pseudoDocument.detailsPartial;
    context.ctx = await this.pseudoDocument.getSheetContext(options);
    return context;
  }
}
