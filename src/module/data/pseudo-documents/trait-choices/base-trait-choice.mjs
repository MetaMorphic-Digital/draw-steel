import TypedPseudoDocument from "../typed-pseudo-document.mjs";

export default class BaseTraitChoice extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      documentName: "TraitChoice",
      embedded: {},
      sheetClass: null,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
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
