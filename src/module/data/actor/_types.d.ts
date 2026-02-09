import DrawSteelActor from "../../documents/actor.mjs";
import { ObjectSizeModel, SizeModel, SourceModel } from "../models/_module.mjs";

interface BarAttribute {
  value: number,
  max: number
}

interface Biography {
  value: string;
  director: string;
}

interface Characteristic {
  value: number;
  edges: number;
  banes: number;
  rollThree: -1 | 0 | 1;
}

interface Characteristic {
  value: number;
  edges: number;
  banes: number;
  rollThree: -1 | 0 | 1;
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
  size: SizeModel | ObjectSizeModel;
  stability: number;
  turns: number;
  save: {
    bonus: string;
    threshold: number;
  }
}

declare module "./base-actor.mjs" {
  export default interface BaseActorModel {
    parent: DrawSteelActor;
    stamina: BarAttribute & {
      temporary: number;
      winded: number;
      bonuses: {
        echelon: number;
        level: number;
      }
      /** Added by ObjectModel */
      maxLabel?: string;
    },
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
    restrictions: {
      type: Set<string>;
      dsid: Set<string>;
    }
    statuses: {
      immunities: Set<string>;
      slowed: {
        speed: number;
      };
      flankable: boolean;
      canFlank: boolean;
    }
  }
}

declare module "./creature.mjs" {
  export default interface CreatureModel {
    biography: Biography & {
      languages: Set<string>;
    }
    characteristics: Record<string, Characteristic>;
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
      languages: Set<string>;
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
    ev: number;
    evLabel: string;
    monster: {
      freeStrike: number;
      keywords: Set<string> & { list: string[]; labels: string };
      level: number;
      role: string;
      roleLabel: string;
      organization: string;
      organizationLabel: string;
    }
  }
}

declare module "./object.mjs" {
  export default interface ObjectModel {
    source: SourceModel;
    ev: number;
    evLabel: string;
    object: {
      level: number;
      category: string;
      role: string;
      area: string;
      squareStamina: boolean;
      roleLabel: string;
      categoryLabel: string;
    }
  }
}
