import DrawSteelCombatantGroup from "../../documents/combatant-group.mjs";

declare module "./base.mjs" {
  export default interface BaseCombatantGroupModel {
    parent: DrawSteelCombatantGroup;
    initiative: number;
  }
}

declare module "./squad.mjs" {
  export default interface SquadModel {
    staminaValue: number;
  }
}
