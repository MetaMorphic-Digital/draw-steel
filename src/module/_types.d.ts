import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import "./helpers/_types";
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
  baseRoll: PowerRoll;
  rolls: Array <PowerRoll | DrawSteelChatMessage | object>;
}

export interface ProjectRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  projectRoll: ProjectRoll | DrawSteelChatMessage;
}

/* -------------------------------------------------- */

interface AdvancementLeaf {
  node: AdvancementChain;
  children: Record<string, AdvancementChain>;
  /** Whether this specific choice has been selected. */
  isChosen: boolean;
}

export interface AdvancementChainItemGrantLeaf extends AdvancementLeaf {
  item: DrawSteelItem;
  itemLink: HTMLElement;
}

export interface AdvancementChainTraitLeaf extends AdvancementLeaf {
  choice: string;
  trait: string;
}

export interface AdvancementChainCharacteristicLeaf extends AdvancementLeaf {
  choice: string;
  characteristic: string;
}

declare module "./utils/advancement-chain.mjs" {
  export default interface AdvancementChain {
    advancement: BaseAdvancement;
    parent?: AdvancementChain;
    depth: number;
    isRoot: boolean;
    choices: Record<string, AdvancementChainItemGrantLeaf | AdvancementChainTraitLeaf | AdvancementChainCharacteristicLeaf>;
    selected: Record<string, boolean | number>;
    levels: [number, number];

    // Helper property to detect if this has been chosen. Only relevant for root or item grant nodes.
    parentChoice?: AdvancementChainItemGrantLeaf;

    isChosen: boolean;
  }
}
