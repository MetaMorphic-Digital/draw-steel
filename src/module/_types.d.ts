import "./applications/_types";
import "./canvas/_types";
import "./data/_types";
import "./documents/_types";
import {
  DrawSteelActor,
  DrawSteelChatMessage,
} from "./documents/_module.mjs";

import Advancement from "./documents/advancement/advancement.mjs";
import {
  PowerRoll,
  ProjectRoll,
} from "./rolls/_module.mjs";

export interface AdvancementTypeConfiguration {
  /**
   * The advancement's document class.
   */
  dataModel: typeof Advancement;

  /**
   * What item types this advancement can be used with.
   */
  validItemTypes: Set <string>;

  /**
   * Should this advancement type be hidden in the selection dialog?
   */
  hidden ?: boolean;
}

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

export interface AdvancementChainLink {
  advancement: InstanceType<BaseAdvancement>;
  parent?: AdvancementChainLink;
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

export interface AdvancementChainItemGrantLeaf {
  item: foundry.documents.Item;
  node: AdvancementChainLink;
  itemLink: HTMLElement;
  children: Record<string, AdvancementChainTraitLeaf>;

  // Whether this specific choice has been selected.
  isChosen: boolean;
}

export interface AdvancementChainTraitLeaf {
  node: AdvancementChainLink;
  trait: string;
  children: object;

  // Whether this specific choice has been selected.
  isChosen: boolean;
}
