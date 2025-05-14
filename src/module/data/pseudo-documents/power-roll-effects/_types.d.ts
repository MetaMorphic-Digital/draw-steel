declare module "./base-power-roll-effect.mjs" {
  export default interface BasePowerRollEffect {
    name: string;
  }
}

export type DamageSchema = {
  value: string;
  types: Set<string>;
}

declare module "./damage-effect.mjs" {

  export default interface DamagePowerRollEffect {
    damage: {
      tier1: DamageSchema;
      tier2: DamageSchema;
      tier3: DamageSchema;
    }
  }
}

export type OtherSchema = {
  value: string;
}

declare module "./other-effect.mjs" {
  export default interface OtherPowerRollEffect {
    text: {
      tier1: OtherSchema;
      tier2: OtherSchema;
      tier3: OtherSchema;
    }
  }
}

export type AppliedEffectSchema = {
  display: string;
  always: Set<string>;
  success: Set<string>;
  failure: Set<string>;
  potency: {
    value: string;
    characteristic: string;
  }
}

declare module "./applied-effect.mjs" {
  export default interface AppliedPowerRollEffect {
    ae: {
      tier1: AppliedEffectSchema;
      tier2: AppliedEffectSchema;
      tier3: AppliedEffectSchema;
    }
  }
}
