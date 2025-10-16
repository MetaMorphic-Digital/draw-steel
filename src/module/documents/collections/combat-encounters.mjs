import { systemID } from "../../constants.mjs";

/**
 * An extension of the core Actors collection with extra convenience functions.
 */
export default class DrawSteelCombatEncounters extends foundry.documents.collections.CombatEncounters {
  /**
   * Easy check if the game is using the default initiative system.
   * @type {boolean}
   */
  get isDefaultInitiativeMode() {
    return game.settings.get(systemID, "initiativeMode") === "default";
  }
}
