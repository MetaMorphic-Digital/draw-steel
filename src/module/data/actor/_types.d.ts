import { DrawSteelActor } from "../../documents/actor.mjs";
import { BarAttribute } from "../_types";

declare module "./base.mjs" {
  export default interface BaseActorModel {
    parent: DrawSteelActor;
    stamina: BarAttribute & {winded: number},
    characteristics: Record<typeof ds["CONFIG"]["characteristics"][0], { value: number}>;
    combat: {
      size: number;
      weight: number;
      stability: number;
      reach: number;
    }
    biography: {
      value: string;
      gm: string;
      languages: Set<string>;
    }
    movement: {
      walk: number | null;
      burrow: number | null;
      climb: number | null;
      swim: number | null;
      fly: number | null;
      teleport: number | null;
    }
    damage: {
      immunities: Record<string, number>;
      weaknesses: Record<string, number>;
    }
  }
}

declare module "./character.mjs" {
  type HeroicResource = {
    value: number;
    label?: string;
  }

  export default interface CharacterModel {
    hero: {
      primary: HeroicResource;
      secondary: HeroicResource;
      xp: number;
      recoveries: BarAttribute & {
        bonus: number;
        recoveryValue: number;
      };
      renown: number;
      skills: Set<string>;
    }
  }
}

declare module "./npc.mjs" {
  export default interface NPCModel {
    negotiation: {
      interest: number;
      patience: number;
      motivations: Set<string>;
      pitfalls: Set<string>;
      impression: number;
    }
    monster: {
      keywords: Set<string>;
      ev: number;
      role: string;
      subrole: string;
    }
  }
}
