export default class DrawSteelTokenDocument extends TokenDocument {
  /**
   * Is the token's movement currently shifting?
   * @type {boolean}
   */
  get isShifting() {
    return false; // TODO
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
        3 * canvas.scene.grid.size
      );
      const found = canvas.tokens.quadtree.getObjects(rect);
      for (const object of found) {
        if ((object.id !== this.id) && !tokens.has(object.document)) {
          const distance = canvas.grid.measurePath([point, object.center]).distance;
          if (distance <= 1) tokens.add(object.document);
        }
      }
    }
    return Array.from(tokens);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdateMovement(movement, operation = {}) {
    const nextSegment = movement.passed;
    const tokens = this.getHostileTokensFromPoints(nextSegment);

    if (tokens.length) {
      // TODO: Prompt to confirm the movement.
      const allowed = true;
      if (allowed === false) return false;
    }
  }
}
