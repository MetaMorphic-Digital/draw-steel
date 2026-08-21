/**
 * @import {TokenData} from "@common/documents/_types.mjs"
 * @import {DrawSteelActor, DrawSteelTokenDocument} from "../../documents/_module.mjs";
 */

/**
 * A Placeable Layer subclass adding system-specific behavior and registered in CONFIG.Canvas.layers.tokens.layerClass.
 */
export default class DrawSteelTokenLayer extends foundry.canvas.layers.TokenLayer {
  /**
   * Helper function to place a token on the canvas given an actor.
   * @param {DrawSteelActor} actor              The actor to place one or more copies of.
   * @param {object} [options]
   * @param {number} [options.count]            Actor instances to place (default: 1).
   * @param {TokenData} [options.tokenUpdates]  Additional token data to merge into the placed token.
   * @param {ActorData} [options.actorUpdates]  Additional token data to merge into the placed token.
   * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
   */
  async placeActor(actor, options = {}) {
    if (actor.inCompendium) {
      throw new Error("Placing actors from compendiums is currently not supported.");
    }

    // Ensure the user has permission to drop the actor and create a Token.
    if (!game.user.can("TOKEN_CREATE")) {
      ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.TOKEN_CREATE", { localize: true });
      return null;
    }

    const tokenPromises = Array.fromRange(options.count ?? 1)
      .map(index => this.#getTokenData(actor, index, options.tokenUpdates, options.actorUpdates));

    const createData = await Promise.all(tokenPromises);

    return this.placeTokens(createData);
  }

  /* -------------------------------------------------- */

  /**
   * Fetch token data, making appropriate adjustments to token and actor data.
   * @param {DrawSteelActor} actor           The base actor for the token.
   * @param {number} [index]                 The index of the token for.
   * @param {TokenData} [tokenUpdates]       Additional token data to merge into the placed token.
   * @param {ActorData} [actorUpdates]       Additional token data to merge into the placed token.
   * @return {Promise<TokenData>}
   */
  async #getTokenData(actor, index, tokenUpdates = {}, actorUpdates = {}) {

    if (actor.prototypeToken.randomImg && !game.user.can("FILES_BROWSE")) {
      tokenUpdates.texture ??= {};
      tokenUpdates.texture.src ??= actor.img;
      ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.WILDCARD", { localize: true });
    }

    const tokenDocument = await actor.getTokenDocument(tokenUpdates, { parent: canvas.scene });

    // Linked summons require more explicit updates before token creation.
    // Unlinked summons can take actor delta directly.
    if (tokenDocument.actorLink) {
      const { effects, items, ...rest } = actorUpdates;
      await tokenDocument.actor.update(rest);
      await tokenDocument.actor.updateEmbeddedDocuments("Item", items ?? []);

      const { newEffects = [], oldEffects = [] } = Object.groupBy(effects ?? [], effect => {
        return tokenDocument.actor.effects.get(effect._id) ? "oldEffects" : "newEffects";
      });

      await tokenDocument.actor.updateEmbeddedDocuments("ActiveEffect", oldEffects);
      await tokenDocument.actor.createEmbeddedDocuments("ActiveEffect", newEffects, { keepId: true });
    } else {
      tokenDocument.delta.updateSource(actorUpdates);
      // Foundry will automatically increment but we need to add in our indices
      if (actor.prototypeToken.appendNumber) {
        const regex = new RegExp(/\((\d+)\)$/);
        const match = tokenDocument.name?.match(regex);
        if (match) {
          const name = tokenDocument.name.replace(regex, `(${Number(match[1]) + index})`);
          tokenDocument.updateSource({ name });
        }
      }
    }

    return tokenDocument.toObject();
  }
}
