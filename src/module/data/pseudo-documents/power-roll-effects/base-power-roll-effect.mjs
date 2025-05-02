import TypedPseudoDocument from "../typed-pseudo-document.mjs";

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
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
