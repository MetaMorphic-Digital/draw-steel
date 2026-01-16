/**
 * Play rolls via the DSN API.
 * @param {foundry.dice.Roll} roll
 * @param {foundry.documents.ChatMessage} message
 * @returns {Promise<boolean>} When resolved true if the animation was displayed, false if not.
 */
export async function playRoll(roll, message) {
  if (!game.dice3d) return false;

  return game.dice3d.showForRoll(roll, game.user, true, message.whisper, message.blind, message.id, message.speaker);
}
