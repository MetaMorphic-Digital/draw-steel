import TypedPseudoDocument from "../typed-pseudo-document.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DataSchema } from "@common/abstract/_types.mjs"
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs"
 * @import AdvancementChain from "../../../utils/advancement-chain.mjs";
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
      level: new NumberField({ min: 1, integer: true, max: 10, required: true }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CREATE_TEMPLATE = systemPath("templates/sheets/pseudo-documents/advancement/create-dialog.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _prepareCreateDialogContext(parent) {

    /** @type {FormSelectOption[]} */
    const typeOptions = Object.entries(ds.CONFIG.Advancement).reduce((arr, [value, config]) => {
      if (config.itemTypes.has(parent.type)) arr.push({ value, label: config.label });
      return arr;
    }, []);

    return {
      typeOptions,
      fields: this.schema.fields,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Does this trait have a choice to make?
   * @type {boolean}
   */
  get isChoice() {
    return false;
  }

  /* -------------------------------------------------- */

  /**
   * Determine if this advancement can be reconfigured.
   * @returns {boolean}
   */
  get canReconfigure() {
    const actor = this.document.parent;
    return !!actor && (this.requirements.level <= actor.system.level) && this.isChoice;
  }

  /* -------------------------------------------------- */

  /**
   * At which levels this advancement applies.
   * @type {number[]}
   */
  get levels() {
    return [this.requirements.level];
  }

  /* -------------------------------------------------- */

  /**
   * Configure this advancement such that all choices have been made. Optionally also apply
   * these choices to a node in an advancement chain.
   * @param {AdvancementChain} node   A node that is configured in-place and used to gather options. **will be mutated**.
   * @returns {Promise<object>}       A promise that resolves to an update to perform on the parent of the advancement.
   * @abstract
   */
  async configureAdvancement(node) {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Redo the advancements on this item.
   * Base function provides error checking.
   * @abstract
   */
  async reconfigure() {
    if (!this.canReconfigure) throw new Error("You can only reconfigure advancements if the item is embedded in an actor");
  }

  /* -------------------------------------------------- */

  /**
   * Type-specific context prep for this Advancement.
   * Called by AdvancementSheet##prepareDetailsContext.
   * @param {object} options The rendering options.
   * @returns {Promise<object>} Additional context information.
   */
  async getSheetContext(options) {
    return {};
  }
}
