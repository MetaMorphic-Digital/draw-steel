/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass
 */
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

  /* -------------------------------------------------- */

  /**
   * The current ruler data path, segmentized.
   * @returns {object[][]}    Waypoints split into segments.
   */
  get segmentizedFoundPath() {
    const path = this._rulerData[game.user.id]?.foundPath ?? [];
    const segments = path.reduce((acc, waypoint) => {
      acc.at(-1).push(waypoint);
      if (!waypoint.intermediate) acc.push([]);
      return acc;
    }, [[]]);
    segments.pop();
    return segments;
  }
}
