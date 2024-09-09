import { DrawSteelItem } from "../../documents/item.mjs";


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
    _dsid: string | null;
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
    damageDisplay: "melee" | "ranged" | "";
    distance: {
      type: keyof typeof ds["CONFIG"]["abilities"]["distances"];
      primary: number;
      secondary: number;
    }
    trigger: string;
    target: {
      type: string;
      value: number;
      all: boolean;
    }
    powerRoll: {
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
  export default interface ClassModel {}
}

declare module "./complication.mjs" {
  export default interface ComplicationModel {}
}

declare module "./culture.mjs" {
  export default interface CultureModel {}
}

declare module "./equipment.mjs" {
  export default interface EquipmentModel {}
}

declare module "./feature.mjs" {
  export default interface FeatureModel {}
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
      weapon: string;
      implement: string;
    }
    bonuses: {
      stamina: number;
      speed: number;
      stability: number;
      melee: {
        damage: DamageSchema;
        reach: number;
      }
      ranged: {
        damage: DamageSchema;
        distance: number;
      }
      magic: {
        damage: DamageSchema;
        distance: number;
        area: number;
      }
    }
  }
}

declare module "./title.mjs" {
  export default interface TitleModel {}
}
