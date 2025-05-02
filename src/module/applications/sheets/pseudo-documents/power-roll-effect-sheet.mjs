import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

export default class PowerRollEffectSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
  };
}
