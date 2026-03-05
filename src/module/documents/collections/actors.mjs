import { systemID } from "../../constants.mjs";

/**
 * @import { HeroTokenModel, MaliceModel } from "../../data/settings/_module.mjs";
 * @import DrawSteelActor from "../actor.mjs";
 */

/**
 * An extension of the core Actors collection with extra convenience functions.
 */
export default class DrawSteelActors extends foundry.documents.collections.Actors {
  /**
   * Easy access to the current hero tokens.
   * @type {HeroTokenModel}
   */
  get heroTokens() {
    return game.settings.get(systemID, "heroTokens");
  }

  /* -------------------------------------------------- */

  /**
   * Easy access to the current malice.
   * @type {MaliceModel}
   */
  get malice() {
    return game.settings.get(systemID, "malice");
  }

  /* -------------------------------------------------- */

  /**
   * The primary party.
   * @type {DrawSteelActor}
   */
  get party() {
    return game.settings.get(systemID, "primaryParty")?.actor ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Unset the primary party.
   * @returns {Promise<boolean>}    A promise that resolves to whether the modification was successful.
   */
  async unsetParty() {
    if (!game.user.isGM) {
      throw new Error("Only a GM can unassign the primary party!");
    }

    if (!this.party) return false;
    await game.settings.set(systemID, "primaryParty", { actor: null });
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Set the primary party.
   * @param {DrawSteelActor} actor    The actor to assign as the primary party.
   * @returns {Promise<boolean>}      A promise that resolves to whether the modification was successful.
   */
  async setParty(actor) {
    if (!game.user.isGM) {
      throw new Error("Only a GM can assign the primary party!");
    }

    if (!actor || (actor.type !== "party")) return false;
    if (actor === this.party) return false;

    await game.settings.set(systemID, "primaryParty", { actor: actor.id });
    return true;
  }
}
