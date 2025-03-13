import { PowerRollModifiers } from "../../_types.js";
import { DrawSteelItem } from "../../documents/item.mjs";
import SourceModel from "../models/source.mjs";

export type ItemMetaData = Readonly<{
  /** The expected `type` value */
  type: string;
  /** Actor types that this item cannot be placed on */
  invalidActorTypes: string[];
  /** Are there any partials to fill in the Details tab of the item? */
  detailsPartial?: string[];
  /** Does this item have advancements? */
  hasAdvancements?: boolean;
}>

declare module "./base.mjs" {
  export default interface BaseItemModel {
    parent: DrawSteelItem;
    description: {
      value: string;
      gm: string;
    }
    source: SourceModel;
    /** The Draw Steel ID, indicating a unique game rules element */
    _dsid: string;
  }
}

declare module "./ability.mjs" {

  export interface Potency {
    potency: {
      enabled: boolean,
      value: string | number;
      characteristic: string;
    }
  }
  export interface PotencyData extends Potency {
    embed: string
  }

  type PowerRoll = {
    damage: {
      value: string;
      type: string;
    }
    ae: string;
    potency: Potency;
    forced: {
      type: string;
      value: number;
      vertical: boolean;
    }
    description: string;
  }

  export default interface AbilityModel {
    description: {
      value: string;
      gm: string;
      flavor: string;
    }
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
      /** Null value indicates "all"*/
      value: number | null;
    }
    powerRoll: {
      enabled: boolean;
      /** The set of characteristics available to this power roll */
      characteristics: Set<string>;
      /** The highest characteristic of those available. Not set if there's no parent actor. */
      characteristic?: string;
      formula: string;
      tier1: PowerRoll;
      tier2: PowerRoll;
      tier3: PowerRoll;
    }
    spend: {
      value: number;
      text: string;
    };
    effect: string;
  }

  export interface AbilityUseOptions {
    event: UIEvent,
    modifiers: PowerRollModifiers
  }
}

declare module "./ancestry.mjs" {
  export default interface AncestryModel { }
}

declare module "./career.mjs" {
  export default interface CareerModel { }
}

declare module "./class.mjs" {
  export default interface ClassModel {
    level: number;
    primary: string;
    turnGain: string;
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
  export default interface ComplicationModel { }
}

declare module "./culture.mjs" {
  export default interface CultureModel { }
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
  }
}

declare module "./kit.mjs" {

  type DamageSchema = {
    tier1: number;
    tier2: number;
    tier3: number;
  }

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
