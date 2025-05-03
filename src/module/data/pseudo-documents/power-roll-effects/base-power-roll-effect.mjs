import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class BasePowerRollEffect extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "PowerRollEffect",
      sheetClass: ds.applications.sheets.pseudoDocuments.PowerRollEffectSheet,
      types: ds.data.pseudoDocuments.powerRollEffects,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      text: new StringField({ required: true }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Utility method to duplicate fields across three tiers.
   * @param {Function} fieldsFn   A method that returns an object of data fields.
   * @returns {SchemaField}       A constructed schema field with three tiers.
   */
  static duplicateTierSchema(fieldsFn) {
    return new SchemaField({
      tier1: new SchemaField(fieldsFn()),
      tier2: new SchemaField(fieldsFn()),
      tier3: new SchemaField(fieldsFn()),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Implement rendering context for tiers 1-3.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {Promise<void>}   A promise that resolves once the rendering context has been mutated.
   */
  async _tierRenderingContext(context) {}
}
