import { ConfigData, DrawSteelImageData, ReferenceData } from "../../../data/journal-entry-pages/_module.mjs";

declare module "./config-page.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: foundry.documents.JournalEntryPage & { system: ConfigData };
  }
}

declare module "./draw-steel-image-sheet.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: foundry.documents.JournalEntryPage & { system: DrawSteelImageData };
  }
}

declare module "./reference-page.mjs" {
  export default interface DrawSteelImageSheet extends foundry.applications.api.DocumentSheet {
    document: foundry.documents.JournalEntryPage & { system: ReferenceData };
  }
}

export interface ConfigContextEntry {
  fields: Record<string, foundry.data.fields.DataField>;
  values: Record<string, string>;
  keyPlaceholder: string ;
  names: Record<string, string>;
  warnDuplicateKey?: boolean
}
