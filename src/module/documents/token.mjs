import { systemID } from "../constants.mjs";

/** @import DrawSteelToken from "../canvas/placeables/token.mjs"; */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Token.documentClass.
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
   * Convenient reference to the movement types on the associated actor.
   * @type {Set<string>}
   */
  get movementTypes() {
    return this.actor?.system.movement?.types ?? new Set();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _inferMovementAction() {
    // Teleporting creatures should always prefer it
    if (this.movementTypes.has("teleport")) return "teleport";
    else if (this.hasStatusEffect("prone")) return "crawl";
    else {
      for (const action of ds.CONFIG.speedOptions) if (this.movementTypes.has(action)) return action;
      return super._inferMovementAction();
    }
  }

  /* -------------------------------------------------- */

  /**
   * If the token's movementAction is invalid, force it to null (default).
   * @returns {Promise<boolean>} Whether the refresh has caused a change in movementAction.
   */
  async refreshMovementAction() {
    if (!CONFIG.Token.movement.actions[this.movementAction].canSelect(this)) {
      await this.update({ movementAction: null }, { diff: false });
      return true;
    }
    return false;
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
  _onRelatedUpdate(update = {}, operation = {}) {
    if (game.user.isActiveGM) this.combatant?.group?.system.refreshCaptainEffect?.();
    return super._onRelatedUpdate(update, operation);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onOverrideSize(changes) {
    return this.resize(changes, { pan: false, animation: {
      duration: 500,
    } });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const barData = super.getBarAttribute(barName, { alternative });
    // == null covers null & undefined
    if (barData == null) return null;

    if (barData?.attribute !== "stamina") return barData;

    // Set minion specific stamina bar data based on their combat squad
    if (!this.actor.isMinion) {
      const staminaData = this.actor.system.stamina;
      barData.min = staminaData.min ?? 0;
      barData.value += staminaData.temporary || 0;
      barData.temporary = staminaData.temporary;
      if (staminaData.winded) barData.winded = staminaData.winded;

      return barData;
    }

    let barMax = barData.max;
    let barValue = barData.value;

    Object.defineProperties(barData, {
      max: {
        get: () => {
          const combatGroup = this.actor.system.combatGroup;
          return combatGroup ? combatGroup.system.staminaMax : barMax;
        },
        set: value => {
          barMax = value;
        },
      },
      value: {
        get: () => {
          const combatGroup = this.actor.system.combatGroup;
          return combatGroup ? combatGroup.system.staminaValue : barValue;
        },
        set: value => {
          barValue = value;
        },
      },
      minionStamina: {
        value: true,
      },
    });

    return barData;
  }
}
