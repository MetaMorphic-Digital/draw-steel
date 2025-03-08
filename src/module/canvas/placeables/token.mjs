export default class DrawSteelToken extends foundry.canvas.placeables.Token {
  /**
   * Does this token visibly show its ability to strike when another token is moving?
   * This method does not take starting positions or distances into account.
   * @param {DrawSteelToken|DrawSteelTokenDocument} token    The token that is moving.
   * @returns {boolean}
   */
  canStrike(token) {
    if (token.id === this.id) return false;
    if (!this.document.visible || this.document.isSecret) return false;
    return true;
  }
}
