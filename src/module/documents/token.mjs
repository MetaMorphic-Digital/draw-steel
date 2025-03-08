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
   * @param {Point[]} [points]                An array of points describing a segment of movement.
   * @param {object} [options]
   * @param {boolean} [options.ignoreFirst]   Ignore any tokens that were in range of the first point.
   * @returns {DrawSteelTokenDocument[]}      Hostile tokens.
   */
  getHostileTokensFromPoints(points = [], {ignoreFirst = false} = {}) {
    if (!points.length) return [];
    const tokens = new Set();

    const firsts = new Set();

    for (let [i, point] of points.entries()) {
      point = canvas.grid.getCenterPoint(point);
      const rect = new PIXI.Rectangle(
        point.x - canvas.scene.grid.size * 1.5,
        point.y - canvas.scene.grid.size * 1.5,
        3 * canvas.scene.grid.size,
        3 * canvas.scene.grid.size
      );
      const found = canvas.tokens.quadtree.getObjects(rect);
      for (const {id, document, center} of found) {
        if ((id !== this.id) && !tokens.has(document)) {
          if (ignoreFirst && firsts.has(id)) continue;
          const distance = canvas.grid.measurePath([point, {...center, elevation: document.elevation}]).distance;
          if (distance <= 1) {
            if (i || !ignoreFirst) tokens.add(document);
            if (!i) firsts.add(id);
          }
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
