import "./pseudo-documents/_types";
import * as documents from "../../documents/_module.mjs";
import * as data from "../../data/_module.mjs";
import * as sheets from "@client/applications/sheets/_module.mjs";

// TODO: Remove the extends if/when Foundry updates HBSMixin to use @template

declare module "./active-effect-config.mjs" {
  export default interface DrawSteelActiveEffectConfig extends foundry.applications.api.DocumentSheetV2 {
    document: documents.DrawSteelActiveEffect;
  }
}

declare module "./hero.mjs" {
  export default interface DrawSteelHeroSheet {
    actor: documents.DrawSteelActor & { system: data.Actor.HeroModel };
  }
}
declare module "./npc.mjs" {
  export default interface DrawSteelNPCSheet {
    actor: documents.DrawSteelActor & { system: data.Actor.NPCModel };
  }
}

declare module "./combatant-group-config.mjs" {
  export default interface DrawSteelCombatantGroupConfig extends foundry.applications.api.DocumentSheet {
    document: documents.DrawSteelCombatantGroup;
  }
}

export interface ActiveEffectCategory {
  /** The type of category. */
  type: string;
  /** The localized name of the category. */
  label: string;
  /** The effects in the category. */
  effects: documents.DrawSteelActiveEffect[]
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
  abilities: ActorSheetAbilityContext[];
  showAdd: boolean;
  showHeader: boolean;
}

export interface ActorSheetTreasureContext {
  label: string;
  treasure: ActorSheetItemContext[];
  showAdd: boolean;
}

export interface ActorSheetComplicationsContext {
  label: string;
  complication: ActorSheetItemContext[];
  showAdd: boolean;
  showHeader: boolean;
}

interface AdvancementModelContext {
  name: string;
  img: string;
  sort: number;
  id: string;
  canReconfigure: boolean;
  enrichedDescription: string;
}

export interface AdvancementContext {
  level: number;
  section: string;
  documents: AdvancementModelContext[];
}
