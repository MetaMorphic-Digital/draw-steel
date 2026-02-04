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
    category: string;
  }
}

declare module "./tier-outcome.mjs" {
  export default interface TierOutcomeModel {
    parent: DrawSteelJournalEntryPage;
    tier1: string;
    tier2: string;
    tier3: string;
  }
}
