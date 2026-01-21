import DrawSteelJournalEntryPage from "../../documents/journal-entry-page.mjs";

type ConfigEntry = {
  label: string;
  key: string;
};

declare module "./config.mjs" {
  export default interface ConfigurationModel {
    parent: DrawSteelJournalEntryPage;
    languages: ConfigEntry[];
    monsterKeywords: ConfigEntry[];
  }
}

declare module "./image.mjs" {
  export default interface DrawSteelImageModel {
    parent: DrawSteelJournalEntryPage;
    artDescription: string;
  }
}

declare module "./reference.mjs" {
  export default interface ReferenceModel {
    parent: DrawSteelJournalEntryPage;
    tooltip: string;
  }
}
