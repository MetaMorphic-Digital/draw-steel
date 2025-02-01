import * as documents from "../documents/_module.mjs";

declare module "./actor-sheet.mjs" {
  export interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor;
  }
}

declare module "./item-sheet.mjs" {
  export interface DrawSteelItemSheet {
    item: documents.DrawSteelItem;
  }
}

interface PowerRollDialogModifiers {
  edges: number;
  banes: number;
  ability?: string;
  target?: string;
}

export interface PowerRollDialogPrompt {
  rolls: PowerRollDialogModifiers[];
  damage?: string;
}
