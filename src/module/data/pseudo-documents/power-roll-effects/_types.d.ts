declare module "./base-power-roll-effect.mjs" {
  export default interface BasePowerRollEffect {
    name: string;
  }
}

type PotencySchema = {
  value: string;
  characteristic: string;
}

export type DamageSchema = {
  value: string;
  types: Set<string>;
  properties: Set<string>;
  potency: PotencySchema;
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
  text: string;
  potency: PotencySchema;
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
  potency: PotencySchema;
}

declare module "./applied-effect.mjs" {
  export default interface AppliedPowerRollEffect {
    applied: {
      tier1: AppliedEffectSchema;
      tier2: AppliedEffectSchema;
      tier3: AppliedEffectSchema;
    }
  }
}

export type ForcedMovementSchema = {
  display: string;
  movement: Set<string>;
  distance: number;
  potency: PotencySchema;
  properties: Set<string>;
}

declare module "./forced-movement-effect.mjs" {
  export default interface ForcedMovementPowerRollEffect {
    forced: {
      tier1: ForcedMovementSchema;
      tier2: ForcedMovementSchema;
      tier3: ForcedMovementSchema;
    }
  }
}
