import { DrawSteelCombat } from "../../documents/combat.mjs";

declare module "./base.mjs" {
  export default interface BaseCombatModel {
    parent: DrawSteelCombat;
  }
}
