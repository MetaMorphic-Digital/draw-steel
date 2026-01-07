import DrawSteelJournalEntryPage from "../../documents/journal-entry-page.mjs";

declare module "./image.mjs" {
  export default interface DrawSteelImagePage {
    parent: DrawSteelJournalEntryPage;
    artDescription: string;
  }
}

declare module "./reference.mjs" {
  export default interface ReferenceData {
    parent: DrawSteelJournalEntryPage;
    tooltip: string;
  }
}
