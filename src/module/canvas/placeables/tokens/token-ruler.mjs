/** @import { TokenCompleteMovementWaypoint, TokenMovementActionConfig, TokenRulerWaypoint } from "@client/_types.mjs" */

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
    const teleport = { ...CONFIG.Token.movement.actions.blink, label: "TOKEN.MOVEMENT.ACTIONS.teleport.label" };

    // Adjusting `Blink (Teleport)` to just be Teleport and maintain its use elsewhere
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
        canSelect: (token) => !token.hasStatusEffect("prone"),
        getCostFunction: (token, _options) => {
          if (token.movementTypes.has("climb")) return cost => cost;
          else return cost => cost * 2;
        },
      },
      /** @type {TokenMovementActionConfig} */
      crawl: {
        canSelect: (token) => token.hasStatusEffect("prone"),
      },
      /** @type {TokenMovementActionConfig} */
      fly: {
        canSelect: (token) => !token.hasStatusEffect("prone"),
      },
      /** @type {TokenMovementActionConfig} */
      jump: {
        canSelect: (token) => !token.hasStatusEffect("prone"),
        // default for jump is cost * 2
        getCostFunction: () => cost => cost,
      },
      /** @type {TokenMovementActionConfig} */
      swim: {
        canSelect: (token) => !token.hasStatusEffect("prone"),
        getCostFunction: (token, _options) => {
          if (token.movementTypes.has("swim")) return cost => cost;
          else return cost => cost * 2;
        },
      },
      /** @type {TokenMovementActionConfig} */
      walk: {
        canSelect: (token) => !token.hasStatusEffect("prone"),
      },
    }, { performDeletions: true });
  }

  /* -------------------------------------------------- */

  /**
   * @param {TokenRulerWaypoint} waypoint
   * @param {object} state
   * @inheritdoc */
  _getWaypointLabelContext(waypoint, state) {
    const context = super._getWaypointLabelContext(waypoint, state);

    if (!this.token.inCombat || !waypoint.previous) return context;

    const points = this.token.document.getCompleteMovementPath([waypoint.previous, waypoint]);

    const startedNear = waypoint.previous?.endPointEnemies ?? new Set();
    const endPointEnemies = new Set(this.token.document.getHostileTokensFromPoints([points.at(-1)]));
    const passedBy = new Set(this.token.document.getHostileTokensFromPoints(points)).union(startedNear);
    const delta = waypoint.actionConfig.teleport ? 0 : passedBy.difference(endPointEnemies).size;
    const strikes = {
      delta,
      total: delta + (waypoint.previous?.strikes?.total ?? 0),
    };

    Object.assign(waypoint, { endPointEnemies, strikes });

    if (context) Object.assign(context, { strikes });

    return context;
  }
}
