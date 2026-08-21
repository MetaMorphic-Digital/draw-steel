export {};

declare module "./actor-choice-advancement.mjs" {
  export default interface ActorChoiceAdvancement {
    dsid: string;
  }
}

// declare module "./companion-choice-advancement.mjs" {
//   export default interface SummonChoiceAdvancement {

//   }
// }

interface SummonChoicePool {
  uuid: string;
  count: number;
}

export type ActorChoice = {
  /** The UUID of the actor. */
  uuid: string;
};

declare module "./summon-choice-advancement.mjs" {
  export default interface SummonChoiceAdvancement {
    cost: number;
    /** If `null`, then this is explicitly a "choose all" - but also if the number is equal to or greater than the pool. */
    chooseN: number | null;
    pool: SummonChoicePool[]
  }
}

declare module "./base-advancement.mjs" {
  export default interface BaseAdvancement {
    requirements: {
      level: number;
    }
    description: string;
    repick: {
      respite: null | "activity" | "finish";
    }
  }
}

declare module "./characteristic-advancement.mjs" {
  export default interface CharacteristicAdvancement {
    characteristics: Record<string, number>;
    max: number;
  }
}

interface EffectGrantPool {
  uuid: string;
}

declare module "./effect-grant-advancement.mjs" {
  export default interface EffectGrantAdvancement {
    pool: EffectGrantPool[];
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool. */
    chooseN: number | null;
  }
}

interface ItemGrantPool {
  uuid: string;
}

declare module "./item-grant-advancement.mjs" {
  export default interface ItemGrantAdvancement {
    pool: ItemGrantPool[];
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool. */
    chooseN: number | null;
    additional: {
      type: string | undefined;
      perkType: Set<string>;
      cost: number | null;
    }
  }
}

declare module "./trait-advancement.mjs" {
  export default interface TraitAdvancement {
    any: boolean;
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool. */
    chooseN: number | null;
  }
}

declare module "./language-advancement.mjs" {
  export default interface LanguageAdvancement {
    languages: Set<string>;
  }
}

declare module "./skill-advancement.mjs" {
  export default interface SkillAdvancement {
    skills: {
      groups: Set<string>;
      choices: Set<string>;
    }
  }
}
