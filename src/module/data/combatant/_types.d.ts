declare module "./base.mjs" {
  export default interface BaseCombatantModel {
    /** The combatant disposition. If defined, overrides the associated token dispositions */
    disposition: number | undefined;
  }
}
