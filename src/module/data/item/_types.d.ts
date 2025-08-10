import { SubtypeMetadata } from "../_types.js";
import { PowerRollModifiers } from "../../_types.js";
import DrawSteelItem from "../../documents/item.mjs";
import ModelCollection from "../../utils/model-collection.mjs";
import SourceModel from "../models/source.mjs";
import { AppliedPowerRollEffect, DamagePowerRollEffect, ForcedMovementPowerRollEffect, OtherPowerRollEffect } from "../pseudo-documents/power-roll-effects/_module.mjs";
import { ItemGrantAdvancement, LanguageAdvancement, SkillAdvancement } from "../pseudo-documents/advancements/_module.mjs";

export type ItemMetaData = Readonly<SubtypeMetadata & {
  /** Actor types that this item cannot be placed on. */
  invalidActorTypes: string[];
  /** Is this item type restricted to only appearing in compendium packs? */
  packOnly: boolean;
  /** Are there any partials to fill in the Details tab of the item? */
  detailsPartial?: string[];
}>;

declare module "./base.mjs" {
  export default interface BaseItemModel {
    parent: DrawSteelItem;
    description: {
      value: string;
      director: string;
    }
    source: SourceModel;
    /** The Draw Steel ID, indicating a unique game rules element. */
    _dsid: string;
  }
}

declare module "./ability.mjs" {

  type PowerRollEffects = AppliedPowerRollEffect | DamagePowerRollEffect | ForcedMovementPowerRollEffect | OtherPowerRollEffect;

  export default interface AbilityModel {
    description: never;
    keywords: Set<string>;
    type: keyof typeof ds["CONFIG"]["abilities"]["types"];
    category: keyof typeof ds["CONFIG"]["abilities"]["categories"] | "";
    resource: number;
    damageDisplay: "melee" | "ranged";
    distance: {
      type: keyof typeof ds["CONFIG"]["abilities"]["distances"];
      primary: number;
      secondary: number;
    }
    trigger: string;
    target: {
      type: string;
      /** Null value indicates "all". */
      value: number | null;
    }
    power: {
      /** Added during base data prep, not a schema value. */
      characteristic: {
        key: string;
        /** Null value during data prep or if no parent actor. */
        value: null | number;
      }
      roll: {
        /** Added during data prep. */
        enabled: boolean;
        formula: string;
        characteristics: Set<string>;
      }
      effects: ModelCollection<PowerRollEffects>;
    }
    spend: {
      value: number;
      text: string;
    };
    effect: {
      before: string;
      after: string;
    };
  }

  export interface AbilityUseOptions {
    event: UIEvent,
    modifiers: PowerRollModifiers
  }
}

declare module "./advancement.mjs" {
  type Advancement = ItemGrantAdvancement | LanguageAdvancement | SkillAdvancement;

  export default interface AdvancementModel {
    advancements: ModelCollection<Advancement>;
  }
}

declare module "./ancestry.mjs" {
  // export default interface AncestryModel { }
}

declare module "./career.mjs" {
  export default interface CareerModel {
    projectPoints: number;
    renown: number;
    wealth: number;
  }
}

declare module "./class.mjs" {
  export default interface ClassModel {
    level: number;
    primary: string;
    epic: string;
    turnGain: string;
    minimum: string;
    characteristics: {
      core: Set<string>;
    }
    stamina: {
      starting: number;
      level: number;
    }
    recoveries: number;
  }
}

declare module "./complication.mjs" {
  // export default interface ComplicationModel { }
}

declare module "./culture.mjs" {
  // export default interface CultureModel { }
}

declare module "./equipment.mjs" {
  export default interface EquipmentModel {
    kind: keyof typeof ds["CONFIG"]["equipment"]["kinds"];
    category: keyof typeof ds["CONFIG"]["equipment"]["categories"];
    echelon: keyof typeof ds["CONFIG"]["echelons"];
    keywords: Set<string>;
    project: {
      prerequisites: string;
      source: string;
      rollCharacteristic: Set<string>;
      goal: number;
      yield: {
        amount: string;
        display: string
      }
    }
  }
}

declare module "./feature.mjs" {
  export default interface FeatureModel {
    type: {
      value: string;
      subtype: string;
    }
    prerequisites: {
      value: string;
    }
    story: string;
  }
}

declare module "./kit.mjs" {

  type DamageSchema = {
    tier1: number;
    tier2: number;
    tier3: number;
  };

  export default interface KitModel {
    type: string;
    equipment: {
      armor: string;
      weapon: Set<string>;
      shield: boolean;
    }
    bonuses: {
      stamina: number;
      speed: number;
      stability: number;
      disengage: number;
      melee: {
        damage: DamageSchema;
        distance: number;
      }
      ranged: {
        damage: DamageSchema;
        distance: number;
      }
    }
  }
}

declare module "./project.mjs" {

  export default interface ProjectModel {
    type: keyof typeof ds["CONFIG"]["projects"]["types"];
    prerequisites: string;
    projectSource: string;
    rollCharacteristic: Set<string>;
    goal: number;
    yield: {
      item: string;
      amount: string;
      display: string
    }
  }
}

declare module "./subclass.mjs" {
  export default interface SubclassModel {
    classLink: string;
  }
}
