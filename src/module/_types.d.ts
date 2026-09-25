import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import "./helpers/_types";
import "./utils/advancement/_types";
import { DrawSteelActiveEffect, DrawSteelActor, DrawSteelChatMessage, DrawSteelItem } from "./documents/_module.mjs";
import { PowerRoll, ProjectRoll } from "./rolls/_module.mjs";
import FollowerModel from "./data/item/follower.mjs";
import Level from "@client/documents/level.mjs";
import RegionDocument from "@client/documents/region.mjs";
import { TokenCoordinates } from "@common/documents/_types.mjs";

export interface PowerRollModifiers {
  edges: number;
  banes: number;
  bonuses: number;
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

export interface ProjectRollOptions extends PowerRollModifiers {
  follower?: Omit<DrawSteelItem, "system"> & { system: FollowerModel }
}

export interface PowerRollPrompt {
  messageMode: string;
  baseRoll: PowerRoll;
  rolls: Array <PowerRoll | DrawSteelChatMessage | object>;
}

export interface ProjectRollPrompt {
  messageMode: string;
  projectRoll: ProjectRoll | DrawSteelChatMessage;
}

export interface ProjectRollPromptOptions extends RollPromptOptions {
  follower?: Omit<DrawSteelItem, "system"> & { system: FollowerModel };
}

export interface PerformSummonOptions {
  /** How many tokens to summon. */
  count: number;
  /** Effects to add to the summoned actors, evaluating based on this actor's roll data. */
  effects: DrawSteelActiveEffect[];
}

export interface TokenSurfaceOptions {
  position: TokenCoordinates;
}

export interface TokenSurfaceResults {
  elevation: number;
  region: RegionDocument | null;
  level: Level | null;
}

declare module "./utils/advancement/node.mjs" {
  export default interface AdvancementNode {
    /** Assigned by the Chain Configuration Dialog. */
    enrichedDescription?: string;
  }
}
