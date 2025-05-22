/** @import DrawSteelUser from "../documents/user.mjs"; */
/** @import { DSRoll } from "../rolls/base.mjs"; */

/**
 * Called when a 3D roll starts from the hook of the Chat message or when showForRoll is called directly from the API.
 * @param {string} messageId ID of the message that triggered the roll, or null if the API was called
 * @param {object} context   The data needed to show the roll. Any change made to this object will be used in the roll animation.
 * @param {DSRoll} context.roll An instance of Roll class to show 3D dice animation
 * @param {DrawSteelUser} context.user
 * @param {Array<DrawSteelUser>} context.users List of users or userId who can see the roll, leave it empty if everyone can see.
 * @param {boolean} context.blind If the roll is blind for the current user
 */
export function diceSoNiceRollStart(messageId, context) {
  // `rollOrder === 999` as a special-case way we check for "Don't display these rolls"
  // Added by the PowerRoll.prompt factory method
  if (game.settings.get("dice-so-nice", "enabledSimultaneousRollForMessage")) {
    const terms = context.roll.terms.filter((t, i, arr) => {
      if (t.options.rollOrder === 999) return false;
      else if ((++i < arr.length) && (arr[i].options.rollOrder === 999)) return false;
      return true;
    });
    context.roll = foundry.dice.Roll.fromTerms(terms);
  } else {
    context.blind = context.roll.dice[0].options.rollOrder === 999;
  }
}
