export {};

declare module "./base-advancement.mjs" {
  export default interface BaseAdvancement {
    requirements: {
      level: number;
    }
    description: string;
  }
}

declare module "./characteristic.mjs" {
  export default interface CharacteristicAdvancement {

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
