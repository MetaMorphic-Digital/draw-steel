import AbilityModel from "../../item/ability.mjs";
import DrawSteelItem from "../../../documents/item.mjs";

declare module "./base-special-effect.mjs" {
  export default interface BaseSpecialEffect {
    parent: AbilityModel;
    document: DrawSteelItem;
    description: string;
    before: boolean;
  }
}

declare module "./persistent-effect.mjs" {
  export default interface PersistentSpecialEffect {
    essence: number;
  }
}

declare module "./spend-effect.mjs" {
  export default interface SpendSpecialEffect {
    resource: {
      value: number;
      multiple: boolean;
    }
  }
}

declare module "./summon-effect.mjs" {
  export default interface SummonSpecialEffect {
    summoning: {
      pool: Set<string>;
      count: number;
    }
  }
}
