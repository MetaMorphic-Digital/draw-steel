import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const { BooleanField, HTMLField } = foundry.data.fields;

/**
 * A nested data model for special text entries in abilities like Strained or Persist.
 */
export default class BaseSpecialEffect extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "SpecialEffect",
      icon: "fa-solid fa-file-lines",
      sheetClass: ds.applications.sheets.pseudoDocuments.SpecialEffectSheet,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "base";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.SPECIAL_EFFECT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      description: new HTMLField(),
      before: new BooleanField(),
    });
  }

  /* -------------------------------------------------- */

  /**
   * A handlebars template partial inserted above the prosemirror editor.
   * @type {string} Returns null if no handlebar template is needed for this subtype.
   */
  get detailsPartial() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * The label for this in the ability display.
   * @type {string}
   */
  get label() {
    return this.name;
  }

  /* -------------------------------------------------- */

  /**
   * Type-specific context prep for this Special Effect.
   * Called by SpecialEffectSheet##prepareDetailsContext.
   * @param {object} options The rendering options.
   * @returns {Promise<object>} Additional context information.
   */
  async getSheetContext(options) {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Should this effect show in the ability use message part?
   * @param {object} formData The return form data from AbilityConfigurationDialog.
   * @returns {boolean}
   */
  showUse(formData) {
    return true;
  }
}
