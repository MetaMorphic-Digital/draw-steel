import ModelCollection from "../../../utils/model-collection.mjs";
import { LanguageChoice, SkillChoice } from "../trait-choices/_module.mjs";

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
    traits: ModelCollection<SkillChoice | LanguageChoice>;
    /** If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool */
    chooseN: number | null;
  }
}
