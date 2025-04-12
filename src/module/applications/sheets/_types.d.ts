import * as documents from "../../documents/_module.mjs";
import * as data from "../../data/_module.mjs";

declare module "./actor-sheet.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor;
  }
}
declare module "./character.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & {system: data.Actor.CharacterModel};
  }
}
declare module "./npc.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & {system: data.Actor.NPCModel};
  }
}

declare module "./item-sheet.mjs" {
  export default interface DrawSteelItemSheet {
    item: documents.DrawSteelItem;
  }
}

export interface ActorSheetItemContext {
  item: documents.DrawSteelItem;
  expanded: boolean;
  embed?: HTMLDivElement;
}

interface ActorSheetAbilityContext extends ActorSheetItemContext {
  formattedLabels: Record<"keywords" | "distance" | "target", string>;
  order?: number;
}

export interface ActorSheetAbilitiesContext {
  label: string;
  abilities: ActorSheetAbilityContext[]
}

export interface ActorSheetEquipmentContext {
  label: string;
  equipment: ActorSheetItemContext[]
}
