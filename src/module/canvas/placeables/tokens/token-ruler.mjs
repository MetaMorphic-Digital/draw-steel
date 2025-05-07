/** @import { TokenMovementActionConfig, TokenRulerWaypoint } from "@client/_types.mjs" */
/** @import { DeepReadonly } from "@common/_types.mjs" */
/** @import DrawSteelTokenDocument from "../../../documents/token.mjs"; */

/**
 * Draw Steel implementation of the core token ruler
 */
export default class DrawSteelTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  /** @inheritdoc */
  static WAYPOINT_LABEL_TEMPLATE = "systems/draw-steel/templates/hud/waypoint-label.hbs";

  /* -------------------------------------------------- */

  /**
   * Helper function called in `init` hook
   * @internal
   */
  static applyDSMovementConfig() {
    // Adjusting `Blink (Teleport)` to just be Teleport and maintain its use elsewhere
    const teleport = { ...CONFIG.Token.movement.actions.blink, label: "TOKEN.MOVEMENT.ACTIONS.teleport.label" };
    // Optional chaining on canSelect until https://github.com/foundryvtt/foundryvtt/issues/12603 is resolved
    foundry.utils.mergeObject(CONFIG.Token.movement.actions, {
      "-=blink": null,
      teleport,
      /** @type {TokenMovementActionConfig} */
      burrow: {
        getCostFunction: (token, _options) => {
          if (token.movementTypes.has("burrow")) return cost => cost;
          else return cost => cost * 3;
        },
      },
      /** @type {TokenMovementActionConfig} */
      climb: {
        canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        getCostFunction: (token, _options) => {
          if (token.movementTypes.has("climb")) return cost => cost;
          else return cost => cost * 2;
        },
      },
      /** @type {TokenMovementActionConfig} */
      crawl: {
        canSelect: (token) => (token instanceof TokenDocument) && token.hasStatusEffect("prone"),
      },
      /** @type {TokenMovementActionConfig} */
      fly: {
        canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
      },
      /** @type {TokenMovementActionConfig} */
      jump: {
        canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        // default for jump is cost * 2
        getCostFunction: () => cost => cost,
      },
      /** @type {TokenMovementActionConfig} */
      swim: {
        canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        getCostFunction: (token, _options) => {
          if (token.movementTypes.has("swim")) return cost => cost;
          else return cost => cost * 2;
        },
      },
      /** @type {TokenMovementActionConfig} */
      walk: {
        canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
      },
    }, { performDeletions: true });
  }

  /* -------------------------------------------------- */

  /**
   * @typedef WaypointLabelState
   * @property {TokenRulerWaypoint[]} segmentWaypoints
   * @property {Set<DrawSteelTokenDocument>} endPointEnemies
   * @property {object} strikes
   * @property {number} strikes.delta
   * @property {number} strikes.total
   */

  /**
   * @param {DeepReadonly<TokenRulerWaypoint>} waypoint
   * @param {WaypointLabelState} state
   * @inheritdoc
   */
  _getWaypointLabelContext(waypoint, state) {
    const context = super._getWaypointLabelContext(waypoint, state);

    if (!this.token.inCombat) return context;

    state.segmentWaypoints ??= [];
    state.segmentWaypoints.push(waypoint);

    if (!context) return;

    const points = this.token.document.getCompleteMovementPath(state.segmentWaypoints);

    const startedNear = state.endPointEnemies ?? new Set();
    const endPointEnemies = new Set(this.token.document.getHostileTokensFromPoints([points.at(-1)]));
    const passedBy = new Set(this.token.document.getHostileTokensFromPoints(points)).union(startedNear);
    const delta = waypoint.actionConfig.teleport ? 0 : passedBy.difference(endPointEnemies).size;
    const strikes = {
      delta,
      total: delta + (state.strikes?.total ?? 0),
    };

    state.endPointEnemies = endPointEnemies;
    state.strikes = strikes;
    state.segmentWaypoints = [waypoint];
    context.strikes = strikes;

    return context;
  }

  /**
   * @param {DeepReadonly<TokenRulerWaypoint>} waypoint
   * @inheritdoc
   */
  _getSegmentStyle(waypoint) {
    const segment = super._getSegmentStyle(waypoint);

    const value = foundry.utils.getProperty(this, "token.document.actor.system.movement.value") ?? Infinity;

    // green for up to 1x, yellow for up to 2x, red for 3x
    const colors = [0x33BC4E, 0xF1D836, 0xE72124];

    const index = Math.min(2, Math.floor(waypoint.measurement.cost / value));

    segment.color = colors[index];

    return segment;
  }
}
