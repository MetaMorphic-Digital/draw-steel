import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import "./helpers/_types";
import "./utils/advancement/_types";
import {
  DrawSteelActor,
  DrawSteelChatMessage,
  DrawSteelItem,
} from "./documents/_module.mjs";

import FollowerModel from "./data/item/follower.mjs";

import {
  PowerRoll,
  ProjectRoll,
} from "./rolls/_module.mjs";

export interface PowerRollModifiers {
  edges: number;
  banes: number;
  bonuses: number;
}

export interface ProjectRollOptions extends PowerRollModifiers {
  follower?: Omit<DrawSteelItem, "system"> & { system: FollowerModel }
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

export interface ProjectRollPromptOptions extends RollPromptOptions {
  follower?: Omit<DrawSteelItem, "system"> & { system: FollowerModel }
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
