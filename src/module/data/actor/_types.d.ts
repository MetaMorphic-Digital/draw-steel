import DrawSteelActor from "../../documents/actor.mjs";
import { BarAttribute } from "../_types";
import SizeModel from "../models/size.mjs";
import { DamageSchema } from "../item/kit.mjs";
import SourceModel from "../models/source.mjs";

interface Biography {
  value: string;
  director: string;
  languages: Set<string>;
}

interface CoreResource {
  name: string;
  target: foundry.abstract.DataModel;
  path: string;
  minimum: number;
}

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
      save: {
        bonus: string;
        threshold: number;
      }
    }
    biography: Biography
    movement: {
      value: number;
      types: Set<string>;
      hover: boolean;
      disengage: number;
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
    recoveries: BarAttribute & {
      bonus: number;
      recoveryValue: number;
    };
    hero: {
      primary: HeroicResource;
      epic: HeroicResource;
      xp: number;
      renown: number;
      wealth: number;
      skills: Set<string>;
      preferredKit: string;
    }
    potency: {
      bonuses: number;
      weak: number;
      average: number;
      strong: number;
    }
    biography: Biography & {
      age: string;
      height: {
        value: number;
        units: string;
      }
      weight: {
        value: number;
        units: string;
      }
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
