import { systemID } from "../constants.mjs";

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Token.documentClass
 */
export default class DrawSteelTokenDocument extends foundry.documents.TokenDocument {
  /**
   * Is the token's movement currently shifting?
   * @type {boolean}
   */
  get isShifting() {
    return false; // TODO
  }

  /* -------------------------------------------------- */

  /**
   * The token's current movement action.
   * @type {string}
   */
  get movementType() {
    return this.getFlag(systemID, "movementType") ?? "walk";
  }

  /* -------------------------------------------------- */

  /**
   * Get hostile tokens within range of movement.
   * @param {Point[]} [points]              An array of points describing a segment of movement.
   * @returns {DrawSteelTokenDocument[]}    Hostile tokens.
   */
  getHostileTokensFromPoints(points = []) {
    if (!points.length) return [];
    const tokens = new Set();

    for (let point of points) {
      point = canvas.grid.getCenterPoint(point);
      const rect = new PIXI.Rectangle(
        point.x - canvas.scene.grid.size * 1.5,
        point.y - canvas.scene.grid.size * 1.5,
        3 * canvas.scene.grid.size,
        3 * canvas.scene.grid.size,
      );
      const found = canvas.tokens.quadtree.getObjects(rect);
      for (const token of found) {
        if (!token.canStrike(this) || tokens.has(token.document)) continue;
        const distance = canvas.grid.measurePath([point, { ...token.center, elevation: token.document.elevation }]).distance;
        if (distance <= 1) tokens.add(token.document);
      }
    }
    return Array.from(tokens);
  }
}
