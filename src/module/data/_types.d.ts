import "./actor/_types";
import "./advancement/_types";
import "./combat/_types";
import "./combatant/_types";
import "./combatant-group/_types";
import "./effect/_types";
import "./item/_types";
import "./message/_types";
import "./models/_types";
import "./settings/_types";

export type BarAttribute = {
  value: number,
  max: number
}

export type SubtypeMetadata = {
  /* Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>
}

export type PseudoDocumentMetadata = {
  /* The document name of this pseudo-document. */
  documentName: string,
  /* Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>,
  /* A record of this pseudo-document's base class and subtypes. */
  types?: Record<string, typeof PseudoDocument>,
  /* The class used to render this pseudo-document. */
  sheetClass?: PseudoDocumentSheet,
}
