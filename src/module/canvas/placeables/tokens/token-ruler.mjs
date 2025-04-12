/**
 * Draw Steel implementation of the core token ruler
 */
export default class DrawSteelTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  /** @inheritdoc */
  static WAYPOINT_TEMPLATE = "systems/draw-steel/templates/hud/waypoint-labels.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareWaypointData(waypoints) {
    const result = super._prepareWaypointData(waypoints);

    const segments = this.token.document.getCompleteMovementPath(waypoints).reduce((acc, waypoint) => {
      acc.at(-1).push(waypoint);
      if (!waypoint.intermediate) acc.push([]);
      return acc;
    }, [[]]);
    segments.pop(); // Empty last array

    for (const [i, segment] of segments.entries()) {
      const startedNear = segments[i - 1]?.endPointEnemies ?? new Set();
      const endPointEnemies = new Set(this.token.document.getHostileTokensFromPoints([segment.at(-1)]));
      const passedBy = new Set(this.token.document.getHostileTokensFromPoints(segment)).union(startedNear);
      const strikes = passedBy.difference(endPointEnemies).size;
      Object.assign(segment, {
        endPointEnemies, strikes,
        count: strikes + (segments[i - 1]?.count ?? 0),
      });

      // There may not be a result at this spot if Keyboard movement was used to create a path without a waypoint
      if ((i > 0) && result[i - 1]) {
        Object.assign(result[i - 1], {
          strikes: {
            total: segment.count,
            delta: segment.strikes,
          },
        });
      }
    }

    return result;
  }
}
