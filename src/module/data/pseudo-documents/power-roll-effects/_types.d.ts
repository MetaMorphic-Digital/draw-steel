declare module "./base-power-roll-effect.mjs" {
  export default interface BasePowerRollEffect {
    text: string;
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
