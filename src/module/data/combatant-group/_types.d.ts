import { DrawSteelCombatantGroup } from "../../documents/combatant-group.mjs";

declare module "./base.mjs" {
  export default interface BaseCombatantModel {
    parent: DrawSteelCombatantGroup;
  }
}

declare module "./squad.mjs" {
  export default interface SquadModel {

  }
}
