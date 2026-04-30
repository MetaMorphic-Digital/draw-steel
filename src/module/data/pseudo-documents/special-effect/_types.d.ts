import AbilityModel from "../../item/ability.mjs";

declare module "./base-special-effect.mjs" {
  export default interface BaseSpecialEffect {
    parent: AbilityModel;
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
