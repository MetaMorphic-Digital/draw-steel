/**
 * @import DrawSteelTokenDocument from "../../documents/token.mjs";
 * @import { Point } from "@common/_types.mjs";
 */

/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass.
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
  /*   Flanking                                    */
  /* -------------------------------------------------- */

  /**
   * Can the token's actor flank? Effects that restrict the ability to take triggered actions block flanking.
   * @type {boolean}
   */
  get canFlank() {
    if (!this.actor) return true;
    // Dead actors cannot flank
    if (this.actor.statuses.has("dead")) return false;
    // Checking if active effects have restricted triggered abilities
    return !this.actor.system.restrictions.type.has("triggered");
  }

  /* -------------------------------------------------- */

  /**
   * Can the token's actor be flanked?
   * @type {boolean}
   */
  get canBeFlanked() {
    if (!this.actor) return true;
    return this.actor.system.conditions.flankable;
  }

  /* -------------------------------------------------- */

  /**
   * An array of inset vertices for each of the token's grid spaces.
   * Each vertex is inset by 1px to account for cases where the vertex is on a wall.
   * @returns {Point[]}
   */
  get insetVertices() {
    const vertices = [];

    for (const offset of this.document.getOccupiedGridSpaceOffsets()) {
      const topLeftPoint = { x: offset.j * canvas.grid.size, y: offset.i * canvas.grid.size };

      const topLeft = { x: topLeftPoint.x + 1, y: topLeftPoint.y + 1 };
      const topRight = { x: topLeftPoint.x + canvas.grid.size - 1, y: topLeftPoint.y + 1 };
      const bottomLeft = { x: topLeftPoint.x + 1, y: topLeftPoint.y + canvas.grid.size - 1 };
      const bottomRight = { x: topLeftPoint.x + canvas.grid.size - 1, y: topLeftPoint.y + canvas.grid.size - 1 };

      vertices.push(topLeft, topRight, bottomLeft, bottomRight);
    }

    return vertices;
  }

  /* -------------------------------------------------- */

  /**
   * Determine if any of the token's occupied squares are adjacent to any of the target's occupied squares.
   * @param {DrawSteelToken} target
   * @returns {boolean}
   */
  isAdjacentTo(target) {
    const tokenOffsets = this.document.getOccupiedGridSpaceOffsets();
    const targetOffsets = target.document.getOccupiedGridSpaceOffsets();

    for (const tokenOffset of tokenOffsets) {
      for (const targetOffset of targetOffsets) {
        const adjacent = canvas.grid.testAdjacency(tokenOffset, targetOffset);
        if (adjacent) return true;
      }
    }

    return false;
  }

  /* -------------------------------------------------- */

  /**
   * Return all allies adjacent to the target with line of effect.
   * @param {DrawSteelToken} target
   * @returns {DrawSteelToken[]}
   */
  getAdjacentAllies(target) {
    const alliedTokens = [];
    for (const token of canvas.tokens.placeables) {
      if ((token === this) || (this.document.disposition !== token.document.disposition)) continue;
      if (!token.isAdjacentTo(target) || !token.hasLineOfEffect(target)) continue;

      alliedTokens.push(token);
    }

    return alliedTokens;
  }

  /* -------------------------------------------------- */

  /**
   * Does this token have line of effect to the target token.
   * @param {DrawSteelToken} token    The token that is moving.
   * @returns {boolean}
   */
  hasLineOfEffect(target) {
    const tokenInsetVertices = this.insetVertices;
    const targetInsetVertices = target.insetVertices;

    for (const tokenVertex of tokenInsetVertices) {
      for (const targetVertex of targetInsetVertices) {
        const collsions = CONFIG.Canvas.polygonBackends.move.testCollision(tokenVertex, targetVertex, { type: "move", mode: "all" });
        const hasCollisions = collsions.some(c => c.edges.some(e => e.object?.document?.blocksLineOfEffect ?? true));
        if (!hasCollisions) return true;
      }
    }

    return false;
  }

  /* -------------------------------------------------- */

  /**
   * Are this token and the ally on opposite sides or corners of the target.
   * @param {DrawSteelToken} target
   * @param {DrawSteelToken} ally
   * @returns {boolean}
   */
  onOppositeSideOrCorner(target, ally) {
    const { leftEdge, rightEdge, topEdge, bottomEdge } = target.bounds;

    const [intersectsLeft, intersectsRight, intersectsTop, intersectsBottom] = [leftEdge, rightEdge, topEdge, bottomEdge].map(edge => foundry.utils.lineSegmentIntersects(this.center, ally.center, edge.A, edge.B));

    const onOppositeSides = (intersectsLeft && intersectsRight) || (intersectsTop && intersectsBottom);
    const onOppositeCorners = intersectsLeft && intersectsRight && intersectsTop && intersectsBottom;

    return onOppositeSides || onOppositeCorners;
  }

  /* -------------------------------------------------- */

  /**
   * Is the token flanking the target with an ally.
   * @param {DrawSteelToken} target
   * @returns {boolean}
   */
  isFlanking(target) {
    if (!this.canFlank || !target.canBeFlanked) return false;
    if (!this.isAdjacentTo(target) || !this.hasLineOfEffect(target)) return false;

    const adjacentAllies = this.getAdjacentAllies(target);
    if (adjacentAllies.length === 0) return false;

    for (const ally of adjacentAllies) {
      if (!ally.canFlank) continue;
      // Some features allow you to provide flanking while just adjacent to the target
      if (ally.actor?.system.adjacentFlanking) return true;
      if (this.onOppositeSideOrCorner(target, ally)) return true;
    }

    return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _drawBar(number, bar, data) {
    if (data.attribute !== "stamina") return super._drawBar(number, bar, data);

    const stamina = Number(data.value);

    // Creates a normalized range of 0 to (max stamina - min stamina) used for calculating the token bar percentage
    // Needed to handle actor's negative stamina
    const totalStamina = data.max - data.min;
    const adjustedValue = stamina - data.min;
    const barPct = Math.clamp(adjustedValue, 0, totalStamina) / totalStamina;

    // Determine sizing
    const { width, height } = this.document.getSize();
    const s = canvas.dimensions.uiScale;
    const bw = width;
    const bh = 8 * (this.document.height >= 2 ? 1.5 : 1) * s;

    // Determine the color to use
    // Stamina >= 0 should use core colors - green to red or light blue to blue
    // Stamina < 0 should use red to dark red or blue to dark blue
    let color;
    if (stamina >= 0) {
      const colorPct = Math.clamp(stamina, 0, data.max) / data.max;
      if (number === 0) color = Color.fromRGB([1 - (colorPct / 2), colorPct, 0]);
      else color = Color.fromRGB([0.5 * colorPct, 0.7 * colorPct, 0.5 + (colorPct / 2)]);
    } else {
      const colorPct = Math.clamp(adjustedValue, 0, Math.abs(data.min)) / Math.abs(data.min);
      if (number === 0) color = Color.fromRGB([colorPct + (1 - colorPct) * 0.2, 0, 0]);
      else color = Color.fromRGB([0, 0, 0.5 - ((1 - colorPct) * 0.4)]);
    }

    // Draw the bar
    bar.clear();
    bar.lineStyle(s, 0x000000, 1.0);
    bar.beginFill(0x000000, 0.5).drawRoundedRect(0, 0, bw, bh, 3 * s);
    bar.beginFill(color, 1.0).drawRoundedRect(0, 0, barPct * bw, bh, 2 * s);

    // Set position
    const posY = number === 0 ? height - bh : 0;
    bar.position.set(0, posY);
    return true;
  }
}
