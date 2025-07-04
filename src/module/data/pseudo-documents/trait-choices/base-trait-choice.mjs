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
   * The record of unique, individual trait choices for this trait type
   * @type {Record<string, { label: string; group?: string }>}
   */
  get traitChoices() {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * The list of options for this trait type, including groups.
   * @type {FormSelectOption[]}
   */
  get traitOptions() {
    return Object.entries(this.traitChoices).map(([value, { label, group }]) => ({ value, label, group }));
  }

  /* -------------------------------------------------- */

  /**
   * The list of option values for a given group within this trait type.
   * @param {string} group
   * @returns {string[]}
   */
  choicesForGroup(group) {
    if (!group) return Object.keys(this.traitChoices);
    else return [];
  }

  /* -------------------------------------------------- */

  /**
   * Does this trait choice actually represent a group of trait choices?
   * A blank `options` means all possible choices.
   */
  get isGroup() {
    return !this.options;
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
