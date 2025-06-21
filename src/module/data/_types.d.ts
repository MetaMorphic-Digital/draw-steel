import "./actor/_types";
import "./advancement/_types";
import "./combat/_types";
import "./combatant/_types";
import "./combatant-group/_types";
import "./effect/_types";
import "./item/_types";
import "./message/_types";
import "./models/_types";
import "./models/_types";
import "./settings/_types";

export type BarAttribute = {
  value: number,
  max: number
};

export type SubtypeMetadata = {
  /** The registered document subtype in system.json */
  type: string;
  /* Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>;
};

export type PseudoDocumentMetadata = {
  /* The document name of this pseudo-document. */
  documentName: string,
  /** The localization string for this pseudo-document */
  label: string;
  /** The font-awesome icon for this pseudo-document type */
  icon: string;
  /* Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>,
  /* The class used to render this pseudo-document. */
  sheetClass?: PseudoDocumentSheet,
};
