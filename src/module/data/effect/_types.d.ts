import DrawSteelActiveEffect from "../../documents/active-effect.mjs";

declare module "./base.mjs" {
  export default interface BaseEffectModel {
    parent: DrawSteelActiveEffect;
    end: string;
    characteristic: string;
  }
}
