import { systemID } from "../../constants.mjs";

/** @import { HeroTokenModel, MaliceModel } from "../../data/settings/_module.mjs" */

/**
 * An extension of the core Actors collection with extra convenience functions
 */
export default class DrawSteelActors extends foundry.documents.collections.Actors {
  /**
   * Easy access to the current hero tokens
   * @type {HeroTokenModel}
   */
  get heroTokens() {
    return game.settings.get(systemID, "heroTokens");
  }

  /* -------------------------------------------------- */

  /**
   * Easy access to the current malice
   * @type {MaliceModel}
   */
  get malice() {
    return game.settings.get(systemID, "malice");
  }
}
