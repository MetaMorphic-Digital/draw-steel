import TokenPlacement from "../placeables/tokens/token-placement.mjs";

/**
 * @import {TokenData} from "@common/documents/_types.mjs"
 * @import {DrawSteelActor, DrawSteelTokenDocument} from "../../documents/_module.mjs";
 * @import {TokenPlacementData} from "../placeables/tokens/_types"
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
   * @returns {Promise<DrawSteelTokenDocument[]>}
   */
  async placeToken(actor, options = {}) {
    // Ensure the user has permission to drop the actor and create a Token
    if (!game.user.can("TOKEN_CREATE")) {
      return ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.TOKEN_CREATE", { localize: true });
    }

    const createData = [];

    const placements = await TokenPlacement.place({ tokens: Array(options.count ?? 1).fill(actor.prototypeToken) });

    for (const placement of placements) {
      const tokenData = await this.#getTokenData(actor, placement, options.tokenUpdates, options.actorUpdates);

      createData.push(tokenData);
    }

    const createdTokens = await canvas.scene.createEmbeddedDocuments("Token", createData);

    return createdTokens;
  }

  /**
   * Fetch token data, making appropriate adjustments to token and actor data.
   * @param {DrawSteelActor} actor           The base actor for the token.
   * @param {TokenPlacementData} placement   Placement data.
   * @param {TokenData} [tokenUpdates]       Additional token data to merge into the placed token.
   * @param {ActorData} [actorUpdates]       Additional token data to merge into the placed token.
   */
  async #getTokenData(actor, placement, tokenUpdates = {}, actorUpdates = {}) {
    if (actor.prototypeToken.randomImg && !game.user.can("FILES_BROWSE")) {
      tokenUpdates.texture ??= {};
      tokenUpdates.texture.src ??= actor.img;
      ui.notifications.warn("DRAW_STEEL.Actor.Summoning.Errors.WILDCARD", { localize: true });
    }

    delete placement.prototypeToken;
    const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));

    // Linked summons require more explicit updates before token creation.
    // Unlinked summons can take actor delta directly.
    if (tokenDocument.actorLink) {
      const { effects, items, ...rest } = actorUpdates;
      await tokenDocument.actor.update(rest);
      await tokenDocument.actor.updateEmbeddedDocuments("Item", items);

      const { newEffects, oldEffects } = effects.reduce((acc, curr) => {
        const target = tokenDocument.actor.effects.get(curr._id) ? "oldEffects" : "newEffects";
        acc[target].push(curr);
        return acc;
      }, { newEffects: [], oldEffects: [] });

      await tokenDocument.actor.updateEmbeddedDocuments("ActiveEffect", oldEffects);
      await tokenDocument.actor.createEmbeddedDocuments("ActiveEffect", newEffects, { keepId: true });
    } else {
      tokenDocument.delta.updateSource(actorUpdates);
      if (actor.prototypeToken.appendNumber) TokenPlacement.adjustAppendedNumber(tokenDocument, placement);
    }

    return tokenDocument.toObject();
  }
}
