import DrawSteelActor from "../../documents/actor.mjs";
import SizeModel from "../models/size.mjs";
import SourceModel from "../models/source.mjs";

interface BarAttribute {
  value: number,
  max: number
}

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

interface FreeStrike {
  value: number;
  keywords: Set<string>;
  type: string;
  range: {
    melee: number;
    ranged: number;
  };
}

interface Combat {
  size: SizeModel;
  stability: number;
  turns: number;
  save: {
    bonus: string;
    threshold: number;
  }
}

declare module "./base.mjs" {
  export default interface BaseActorModel {
    parent: DrawSteelActor;
    stamina: BarAttribute & {
      temporary: number;
      winded: number;
      bonuses: {
        echelon: number;
        level: number;
      }
    },
    characteristics: Record<string, { value: number }>;
    combat: Combat;
    biography: Biography;
    movement: {
      value: number;
      types: Set<string>;
      hover: boolean;
      disengage: number;
      teleport: number | null;
      multiplier: number;
      /** Only defined for heroes. */
      kitBonus?: number;
    }
    damage: {
      immunities: Record<string, number>;
      weaknesses: Record<string, number>;
    }
    statuses: {
      immunities: Set<string>;
      slowed: {
        speed: number;
      };
      flankable: boolean;
    }
    potency: {
      bonuses: number;
      weak: number;
      average: number;
      strong: number;
    }
  }
}

declare module "./hero.mjs" {
  type HeroicResource = {
    value: number;
    label?: string;
  };

  export default interface HeroModel {
    combat: Combat & {
      initiativeThreshold: number;
    };
    recoveries: BarAttribute & {
      bonus: number;
      recoveryValue: number;
      divisor: number;
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
      keywords: Set<string> & { list: string[]; labels: string };
      level: number;
      ev: number;
      evLabel: number;
      role: string;
      roleLabel: string;
      organization: string;
      organizationLabel: string;
    }
  }
}
