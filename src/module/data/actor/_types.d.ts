import DrawSteelActor from "../../documents/actor.mjs";
import { BarAttribute } from "../_types";
import SizeModel from "../models/size.mjs";
import { DamageSchema } from "../item/kit.mjs";
import SourceModel from "../models/source.mjs";

declare module "./base.mjs" {
  export default interface BaseActorModel {
    parent: DrawSteelActor;
    stamina: BarAttribute & {
      temporary: number;
      winded: number;
    },
    characteristics: Record<string, { value: number }>;
    combat: {
      size: SizeModel;
      stability: number;
      turns: number;
      saveThreshold: number;
      saveBonus: string;
    }
    biography: {
      value: string;
      gm: string;
      languages: Set<string>;
    }
    movement: {
      value: number;
      types: Set<string>;
      hover: boolean;
      teleport: number | null;
    }
    damage: {
      immunities: Record<string, number>;
      weaknesses: Record<string, number>;
    }
    potency: {
      bonuses: number;
    }
  }
}

declare module "./character.mjs" {
  type HeroicResource = {
    value: number;
    label?: string;
  };

  export default interface CharacterModel {
    hero: {
      primary: HeroicResource;
      // secondary: HeroicResource;
      xp: number;
      recoveries: BarAttribute & {
        bonus: number;
        recoveryValue: number;
      };
      renown: number;
      skills: Set<string>;
      preferredKit: string;
    }
    potency: {
      bonuses: number;
      weak: number;
      average: number;
      strong: number;
    }
    abilityBonuses: {
      melee: {
        distance: number;
        damage?: DamageSchema;
      }
      ranged: {
        distance: number;
        damage?: DamageSchema;
      }
    }
  }
}

declare module "./npc.mjs" {
  export default interface NPCModel {
    source: SourceModel;
    negotiation: {
      interest: number;
      patience: number;
      motivations: Set<string>;
      pitfalls: Set<string>;
      impression: number;
    }
    monster: {
      freeStrike: number;
      keywords: Set<string>;
      level: number;
      ev: number;
      role: string;
      organization: string;
    }
  }
}

interface FreeStrike {
  value: number;
  keywords: Set<string>;
  type: string;
  range: {
    melee: number;
    ranged: number;
  };
}
