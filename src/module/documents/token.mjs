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
   * If the token's movementAction is invalid, force it to null (default)
   * @returns {Promise<boolean>} true if the refresh has caused a change in movementAction, otherwise false
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
  getBarAttribute(barName, { alternative } = {}) {
    const bar = super.getBarAttribute(barName, { alternative });
    if (bar == null) return null;

    let { type, attribute, value, max, editable } = bar;

    // Adjustments made for things that use "spent" instead of "value" in the schema.
    if ((type === "value") && attribute.endsWith(".spent")) {
      const object = foundry.utils.getProperty(this.actor.system, attribute.slice(0, attribute.lastIndexOf(".")));
      value = object.value;
      max = object.max;
      type = "bar";
      editable = true;
    } else if (type === "bar") {
      editable = true;
    }

    const barData = { type, attribute, value, max, editable };
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _getTrackedAttributesFromSchema(schema, _path = []) {
    const attributes = { bar: [], value: [] };
    for (const [name, field] of Object.entries(schema.fields)) {
      const p = _path.concat([name]);
      if (field instanceof foundry.data.fields.NumberField) attributes.value.push(p);
      const isSchema = field instanceof foundry.data.fields.SchemaField;
      const isModel = field instanceof foundry.data.fields.EmbeddedDataField;
      if (isSchema || isModel) {
        const schema = isModel ? field.model.schema : field;
        const isBar = ((schema.has("value") || schema.has("spent")) && schema.has("max")) || schema.options.trackedAttribute;
        if (isBar) attributes.bar.push(p);
        else {
          const inner = this.getTrackedAttributes(schema, p);
          attributes.bar.push(...inner.bar);
          attributes.value.push(...inner.value);
        }
      }
    }
    return attributes;
  }
}
