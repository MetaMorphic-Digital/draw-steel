import DrawSteelCombatant from "../../documents/combatant.mjs";

declare module "./base.mjs" {
  export default interface BaseCombatantModel {
    parent: DrawSteelCombatant;
    /** The combatant disposition. If defined, overrides the associated token dispositions. */
    disposition: number | undefined;
  }
}
