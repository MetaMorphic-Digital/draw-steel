import AdvancementChain from "../../../utils/advancement-chain.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const { FilePathField, StringField } = foundry.data.fields;

export default class BaseAdvancement extends TypedPseudoDocument {
  /** @type {import("../../../_types").PseudoDocumentMetadata} */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "Advancement",
      embedded: {},
      sheetClass: ds.applications.sheets.pseudoDocuments.AdvancementSheet,
      types: ds.data.pseudoDocuments.advancements,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      name: new StringField({ required: true }),
      img: new FilePathField({ categories: ["IMAGE"], initial: this.metadata.defaultImage || null, nullable: true }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.ADVANCEMENT"];

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
