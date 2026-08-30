import { ConfigurationModel, DrawSteelImageModel, ReferenceModel } from "../../../data/journal-entry-pages/_module.mjs";
import DrawSteelJournalEntryPage from "../../../documents/journal-entry-page.mjs";

declare module "./config-page.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: Omit<DrawSteelJournalEntryPage, "system"> & { system: ConfigurationModel };
  }
}

declare module "./draw-steel-image-sheet.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: Omit<DrawSteelJournalEntryPage, "system"> & { system: DrawSteelImageModel };
  }
}

declare module "./reference-page.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: Omit<DrawSteelJournalEntryPage, "system"> & { system: ReferenceModel };
  }
}

export interface ConfigContextEntry {
  fields: Record<string, foundry.data.fields.DataField>;
  values: Record<string, string>;
  keyPlaceholder: string;
  names: Record<string, string>;
  warnDuplicateKey?: boolean;
}
