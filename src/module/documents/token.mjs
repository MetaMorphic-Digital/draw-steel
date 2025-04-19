import { systemID } from "../constants.mjs";

/** @import DrawSteelToken from "../canvas/placeables/token.mjs"; */

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
   * Convenient reference to the movement types on the associated actor
   * @type {Set<string>}
   */
  get movementTypes() {
    return this.actor?.system.movement?.types ?? new Set();
  }

  /* -------------------------------------------------- */

  /**
   * Get hostile tokens within range of movement.
   * @param {Point[]} [points]              An array of points describing a segment of movement.
   * @returns {DrawSteelTokenDocument[]}    Hostile tokens.
   */
  getHostileTokensFromPoints(points = []) {
    // Neutral and secret tokens don't have hostile tokens
    const polarized = (/** @type {DrawSteelTokenDocument} */ tokenDoc) =>
      [CONST.TOKEN_DISPOSITIONS.FRIENDLY, CONST.TOKEN_DISPOSITIONS.HOSTILE].includes(tokenDoc.disposition);

    if (!points.length || !polarized(this)) return [];
    const tokens = new Set();

    for (let point of points) {
      point = canvas.grid.getCenterPoint(point);
      const rect = new PIXI.Rectangle(
        point.x - canvas.scene.grid.size * 1.5,
        point.y - canvas.scene.grid.size * 1.5,
        3 * canvas.scene.grid.size,
        3 * canvas.scene.grid.size,
      );
      /** @type {Set<DrawSteelToken>} */
      const found = canvas.tokens.quadtree.getObjects(rect);
      for (const token of found) {
        const opposedDispositions = polarized(token.document) && (this.disposition !== token.document.disposition);
        if (!token.canStrike(this) || tokens.has(token.document) || !opposedDispositions) continue;
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
    if (!this.actor.isMinion || (this.actor.system.combatGroups.size !== 1)) return barData;

    const combatGroup = this.actor.system.combatGroup;
    barData.min = 0;
    barData.max = combatGroup.system.staminaMax;
    barData.value = combatGroup.system.staminaValue;

    return barData;
  }
}
