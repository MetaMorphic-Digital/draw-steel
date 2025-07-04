import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import {
  DrawSteelActor,
  DrawSteelChatMessage,
  DrawSteelItem,
} from "./documents/_module.mjs";

import {
  PowerRoll,
  ProjectRoll,
} from "./rolls/_module.mjs";
import BaseAdvancement from "./data/pseudo-documents/advancements/base-advancement.mjs";
import AdvancementChain from "./utils/advancement-chain.mjs";

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
}

export interface PowerRollPromptOptions extends RollPromptOptions {
  type: "ability" | "test";
  targets: PowerRollTargets[],
  ability ?: string
}

export interface PowerRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  powerRolls: Array <PowerRoll | DrawSteelChatMessage | object>;
}

export interface ProjectRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  projectRoll: ProjectRoll | DrawSteelChatMessage;
}

/* -------------------------------------------------- */

export interface AdvancementChainItemGrantLeaf {
  item: DrawSteelItem;
  node: AdvancementChain;
  itemLink: HTMLElement;
  children: Record<string, AdvancementChainTraitLeaf>;

  // Whether this specific choice has been selected.
  isChosen: boolean;
}

export interface AdvancementChainTraitLeaf {
  node: AdvancementChain;
  trait: string;
  children: object;

  // Whether this specific choice has been selected.
  isChosen: boolean;
}

declare module "./utils/advancement-chain.mjs" {
  export default interface AdvancementChain {
    advancement: BaseAdvancement;
    parent?: AdvancementChain;
    depth: number;
    isRoot: boolean;
    choices: Record<string, AdvancementChainItemGrantLeaf | AdvancementChainTraitLeaf>;
    selected: Record<string, boolean>;

    // Helper property to detect if this has been chosen. Only relevant for root or item grant nodes.
    parentChoice?: AdvancementChainItemGrantLeaf;

    isChosen: boolean;
    isChoice: boolean;
    chooseN: number | null;
    isConfigured: boolean;
  }
}
