import "./actor/_types";
import "./advancement/_types";
import "./combat/_types";
import "./combatant/_types";
import "./combatant-group/_types";
import "./effect/_types";
import "./item/_types";
import "./journal-entry-pages/_types.mjs";
import "./message/_types";
import "./models/_types";
import "./pseudo-documents/_types";
import "./settings/_types";

export type AbilityFilters = {
  keywords: Set<string>;
};

export type AbilityBonus = foundry.documents.types.EffectChangeData & {
  filters: AbilityFilters;
};

export type SubtypeMetadata = {
  /** The registered document subtype in system.json. */
  type: string;
  /** A FontAwesome icon that can be added to `typeIcons`, e.g. `"fa-solid fa-user"`. */
  icon?: string;
  /** Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>;
};

export type PseudoDocumentMetadata = {
  /** The document name of this pseudo-document. */
  documentName: string,
  /** File path for a default image. */
  defaultImage: string | null;
  /** The font-awesome icon for this pseudo-document type. */
  icon: string;
  /** Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>,
  /** The class used to render this pseudo-document. */
  sheetClass?: PseudoDocumentSheet,
};
