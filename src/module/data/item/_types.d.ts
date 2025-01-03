import { DrawSteelItem } from "../../documents/item.mjs";

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
    source: {
      book: string | null;
      page: string | null;
      license: string | null;
    }
    _dsid: string;
  }
}

declare module "./ability.mjs" {
  type PowerRoll = {
    damage: {
      value: string;
      type: string;
    }
    ae: string;
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
      tier1: PowerRoll;
      tier2: PowerRoll;
      tier3: PowerRoll;
    }
    effect: string;
    spend: number;
  }
}

declare module "./ancestry.mjs" {
  export default interface AncestryModel {}
}

declare module "./career.mjs" {
  export default interface CareerModel {}
}

declare module "./class.mjs" {
  export default interface ClassModel {
    level: number;
    primary: string;
    // secondary: string | undefined;
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
  export default interface ComplicationModel {}
}

declare module "./culture.mjs" {
  export default interface CultureModel {}
}

declare module "./equipment.mjs" {
  export default interface EquipmentModel {
    kind: keyof typeof ds["CONFIG"]["equipment"]["kinds"];
    category: keyof typeof ds["CONFIG"]["equipment"]["categories"];
    echelon: keyof typeof ds["CONFIG"]["echelons"];
    keywords: Set<string>;
    prerequisites: string;
    project: {
      source: string;
      rollCharacteristic: Set<string>;
      goal: number;
      yield: string;
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
