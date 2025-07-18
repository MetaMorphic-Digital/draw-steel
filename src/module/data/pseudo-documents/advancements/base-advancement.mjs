import AdvancementChain from "../../../utils/advancement-chain.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DataSchema } from "@common/abstract/_types.mjs"
 */

const { HTMLField, NumberField, SchemaField } = foundry.data.fields;

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
      icon: "fa-solid fa-circle-nodes",
      sheetClass: ds.applications.sheets.pseudoDocuments.AdvancementSheet,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      description: new HTMLField(),
      requirements: new SchemaField(this.defineRequirements()),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The requirements for this Advancement type.
   * @returns {DataSchema}
   */
  static defineRequirements() {
    return {
      level: new NumberField({ min: 1, integer: true, max: 10 }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CREATE_TEMPLATE = systemPath("templates/sheets/pseudo-documents/advancement/create-dialog.hbs");

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
   * @param {AdvancementChain} [node]   A node that is configured in-place and used to gather options. **will be mutated**.
   * @returns {Promise<object>}         A promise that resolves to an update to perform on the parent of the advancement.
   */
  async configureAdvancement(node = null) {
    return {};
  }
}
