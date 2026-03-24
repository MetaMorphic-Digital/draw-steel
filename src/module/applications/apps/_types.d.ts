import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";

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
