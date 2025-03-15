import "./applications/_types";
import "./data/_types";
import "./documents/_types";
import {
  DrawSteelActor,
  DrawSteelChatMessage
} from "./documents/actor.mjs";

import Advancement from "./documents/advancement/advancement.mjs";
import {
  PowerRoll,
  ProjectRoll
} from "./rolls/_module.mjs";

export interface AdvancementTypeConfiguration {
  /**
   * The advancement's document class.
   */
  dataModel: typeof Advancement;

  /**
   * What item types this advancement can be used with.
   */
  validItemTypes: Set < string > ;

  /**
   * Should this advancement type be hidden in the selection dialog?
   */
  hidden ? : boolean;
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
  data: Record < string, unknown > ;
  skills: Set < string > ;
}

export interface PowerRollPromptOptions extends RollPromptOptions {
  type: "ability" | "test";
  targets: PowerRollTargets[],
  ability ? : string
}

export interface PowerRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  powerRolls: Array < PowerRoll | DrawSteelChatMessage | object > ;
}

export interface ProjectRollPrompt {
  rollMode: keyof typeof CONFIG["Dice"]["rollModes"];
  projectRoll: ProjectRoll | DrawSteelChatMessage;
}
