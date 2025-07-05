export {};

declare module "./base-advancement.mjs" {
  export default interface BaseAdvancement {
    description: string;
  }
}

interface ItemGrantPool {
  uuid: string;
}

declare module "./item-grant-advancement.mjs" {
  export default interface ItemGrantAdvancement {
    requirements: {
      level: number;
    }
    pool: ItemGrantPool[];
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool */
    chooseN: number | null;
  }
}

declare module "./trait-advancement.mjs" {
  export default interface TraitAdvancement {
    requirements: {
      level: number;
    }
    any: boolean;
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool */
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
