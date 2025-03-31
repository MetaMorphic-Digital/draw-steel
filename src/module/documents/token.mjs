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
    return !!this.getFlag(systemID, "shifting");
  }

  /* -------------------------------------------------- */

  /**
   * The token's current movement action.
   * @type {string}
   */
  get movementType() {
    const type = this.getFlag(systemID, "movementType");
    if (type in CONFIG.Token.movement.actions) return type;
    else return CONFIG.Token.movement.defaultAction;
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const barData = super.getBarAttribute(barName, { alternative });
    if (barData?.attribute !== "stamina") return barData;

    barData.min = this.actor.system.stamina.min;

    // Set minion specific stamina bar data based on their combat squad
    const combatGroup = this.actor.system.combatGroup;
    if (!this.actor.isMinion || !combatGroup) return barData;

    barData.min = 0;
    barData.max = combatGroup.system.staminaMax;
    barData.value = combatGroup.system.staminaValue;

    return barData;
  }
}
