import DrawSteelCompendiumTOC from "./table-of-contents.mjs";

export type EntryType = keyof typeof DrawSteelCompendiumTOC.ENTRY_TYPES;

interface PageFlags {
  title: string;
  /** Explicit false to hide regardless, explicit true to show regardless */
  show: boolean;
}

export interface PageContext {
  id: string;
  sort: number;
  tocFlags: Partial<PageFlags>;
  level: number;
  name: string;
  entryId: string;
}

interface ChapterFlags {
  /** Used by "special" pages */
  append: number;
  order: number;
  /** Explicit false to hide regardless, explicit true to show regardless */
  show: boolean;
}

export interface ChapterContext {
  type: EntryType;
  tocFlags: Partial<ChapterFlags>;
  id: string;
  name: string;
  showPages: boolean;
  /** Not assigned for "special" */
  order: number;
  /** Special Entries can end up as pages */
  pages: Array<PageContext | SpecialContext>;
}

interface SpecialContext extends Omit<ChapterContext, "order" | "pages"> {
  sort: number;
  entry: true;
}
