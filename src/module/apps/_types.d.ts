import * as documents from "../documents/_module.mjs";
import * as data from "../data/_module.mjs";
declare module "./actor-sheet/base.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor;
  }
}
declare module "./actor-sheet/character.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & {system: data.Actor.CharacterModel};
  }
}
declare module "./actor-sheet/npc.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & {system: data.Actor.NPCModel};
  }
}

declare module "./item-sheet.mjs" {
  export interface DrawSteelItemSheet {
    item: documents.DrawSteelItem;
  }
}

export interface PowerRollDialogPrompt {
  edges: number;
  banes: number;
  target?: string;
}
