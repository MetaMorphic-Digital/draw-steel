import AdvancementChain from "../../../utils/advancement-chain.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const { HTMLField } = foundry.data.fields;

/**
 * Advancements provide configurable modifications to actors beyond what ActiveEffects can provide.
 * @abstract
 */
export default class BaseAdvancement extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "Advancement",
      sheetClass: ds.applications.sheets.pseudoDocuments.AdvancementSheet,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      description: new HTMLField(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT");

  /* -------------------------------------------------- */

  /**
   * At which levels this advancement applies.
   * @type {number[]}
   */
  get levels() {
    return [];
  }

  /* -------------------------------------------------- */

  /**
   * Configure this advancement such that all choices have been made. Optionally also apply
   * these choices to a node in an advancement chain.
   * @param {AdvancementChain} [node]   A node that is configured in-place and used to gather options. **will be mutated**
   * @returns {Promise<object>}         A promise that resolves to an update to perform on the parent of the advancement.
   */
  async configureAdvancement(node = null) {
    return {};
  }
}
