import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const { StringField } = foundry.data.fields;

/**
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 */

export default class BaseTraitChoice extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      documentName: "TraitChoice",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      options: new StringField({ required: true }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The list of options for this trait type
   * @type {FormSelectOption[]}
   */
  get traitOptions() {
    return [];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.TRAIT_CHOICE");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    throw new Error("The [toString] method of TraitChoice must be overridden.");
  }
}
