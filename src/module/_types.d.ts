import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import "./helpers/_types";
import "./utils/advancement/_types";
import {
  DrawSteelActor,
  DrawSteelChatMessage,
} from "./documents/_module.mjs";

import {
  PowerRoll,
  ProjectRoll,
} from "./rolls/_module.mjs";

export interface PowerRollModifiers {
  edges: number;
  banes: number;
  bonuses: number;
  /** -1 for take lowest 2, 0 for normal, 1 for take highest 2 */
  rollThree: -1 | 0 | 1;
}

export interface PowerRollTargets {
  uuid: string;
  modifiers: PowerRollModifiers;
}

export interface RollPromptOptions {
  evaluation: "none" | "evaluate" | "message";
  modifiers: PowerRollModifiers;
  formula: string;
  actor: DrawSteelActor;
  data: Record <string, unknown>;
  skills: Set <string>;
  skillModifiers: Record<string, PowerRollModifiers>;
}

export interface PowerRollPromptOptions extends RollPromptOptions {
  type: "ability" | "test";
  targets: PowerRollTargets[],
  ability ?: string
}

export interface PowerRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  baseRoll: PowerRoll;
  rolls: Array <PowerRoll | DrawSteelChatMessage | object>;
}

export interface ProjectRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  projectRoll: ProjectRoll | DrawSteelChatMessage;
}

declare module "./utils/advancement/node.mjs" {
  export default interface AdvancementNode {
    /** Assigned by the Chain Configuration Dialog. */
    enrichedDescription?: string;
  }
}
