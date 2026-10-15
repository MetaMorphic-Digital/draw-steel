import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
import ObjectModel from "../../data/actor/object.mjs";
import { ApplicationConfiguration } from "@client/applications/_types.mjs";

interface PowerRollDialogModifiers {
  edges: number;
  banes: number;
  bonuses: number;
  ability?: string;
  target?: string;
}

export interface PowerRollDialogPrompt {
  rolls: PowerRollDialogModifiers[];
  messageMode: string;
  damage?: string;
}
export type BrowserCheckboxFilter = Record<string, -1 | 0 | 1>;

export interface BrowserRangeFilter {
  min: number;
  max: number;
}

export type BrowserFilterConfiguration = Record<string, BrowserCheckboxFilter | BrowserRangeFilter>;

export type BrowserLockedConfiguration = Record<string, boolean | Record<string, boolean>> | boolean;

export type FilterDocumentName = "Actor" | "Item";

// Note: Ensure DrawSteelActor and DrawSteelItem are imported or declared in your environment
export type BrowserDocument = DrawSteelActor | DrawSteelItem;

export type CompendiumFilterCallback = (entry: object, filters: BrowserFilterConfiguration) => boolean;

export type CompendiumFilterVisibility = (filters: BrowserFilterConfiguration) => boolean;

export type BrowserFetchResults = Set<BrowserDocument | object>;

export interface CompendiumFilter {
  /** Human-readable label. */
  label?: string;
  /** The display type of the filter. */
  type: "checkboxes" | "range";
  /** A callback invoked when filtering an entry. */
  callback: CompendiumFilterCallback;
  /** A callback invoked to determine visibility. */
  visible?: CompendiumFilterVisibility;
  /** Which modes have this filter available. */
  modes: FilterDocumentName[];
  /** The array of options to display in a checkbox-like fashion. */
  options?: Array<{ value: string; label: string }>;
  /** A 2-length array which determines the min/max of a 'range'. */
  range?: number[];
}

export interface CompendiumBrowserOptions extends ApplicationConfiguration {
  /** Initial document type to browse. */
  documentName?: FilterDocumentName;
  /** Initial filters. */
  filters?: BrowserFilterConfiguration;
  /** Locked filters. */
  locked?: BrowserLockedConfiguration;
  /** Number of documents to select. */
  selection?: number;
}

declare module "./actor-combat-stats-input.mjs" {
  export default interface ActorCombatStatsInput {
    document: DrawSteelActor;
  }
}

declare module "./characteristic-input.mjs" {
  export default interface CharacteristicInput {
    document: DrawSteelActor;
  }
}

declare module "./document-source-input.mjs" {
  export default interface DocumentSourceInput {
    document: DrawSteelActor | DrawSteelItem;
  }
}

declare module "./object-sizes-input.mjs" {
  export default interface ObjectSizesInput {
    document: Omit<DrawSteelActor, "system"> & { system: ObjectModel };
  }
}
