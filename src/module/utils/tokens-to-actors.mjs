/**
 * @import DrawSteelToken from "../canvas/placeables/token.mjs"
 * @import { DrawSteelActor, DrawSteelTokenDocument } from "../documents/_module.mjs"
 */

/**
 * Convenience method to get the unique actors of an array of tokens.
 * @param {(DrawSteelToken | DrawSteelTokenDocument)[]} [tokens] Defaults to canvas.tokens.controlled
 * @returns {Set<DrawSteelActor>}    The set of actors of the controlled tokens.
 */
export default function tokensToActors(tokens) {
  tokens ??= canvas?.tokens?.controlled ?? [];
  const actors = tokens.map(token => token.actor).filter(_ => _);
  return new Set(actors);
}
