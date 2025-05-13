import TypedPseudoDocument from "../typed-pseudo-document.mjs";

/** @import {DrawSteelActor, DrawSteelItem} from "../../../documents/_module.mjs"; */

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Pseudodocument used by abilities to represent the tiered results of a power roll.
 */
export default class BasePowerRollEffect extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "PowerRollEffect",
      label: "DOCUMENT.PowerRollEffect",
      icon: "fa-solid fa-dice-d10",
      sheetClass: ds.applications.sheets.pseudoDocuments.PowerRollEffectSheet,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      name: new StringField({ required: true }),
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
   * Reference to the grandparent item
   * @type {DrawSteelItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the great-grandparent actor
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.item?.actor;
  }

  /* -------------------------------------------------- */

  prepareDerivedData() {
    super.prepareDerivedData();

    this.name ||= this.typeLabel;
  }

  /* -------------------------------------------------- */

  /**
   * Implement rendering context for tiers 1-3.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {Promise<void>}   A promise that resolves once the rendering context has been mutated.
   */
  async _tierRenderingContext(context) {}

  /* -------------------------------------------------- */

  /**
   * Define how an effect renders on sheets and embeds.
   * @param {number} tier   The specific tier.
   * @returns {string}
   * @abstract
   */
  toText(tier) {}
}
