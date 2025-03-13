export default class DrawSteelTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  /** @inheritdoc */
  _getWaypointLabel(waypoint) {
    if ((waypoint.stage === "passed") || !waypoint.previous || (waypoint.previous.stage === "passed")) {
      return super._getWaypointLabel(waypoint);
    }

    let {text, alpha, scale} = super._getWaypointLabel(waypoint);
    const segments = this.token.segmentizedFoundPath;

    for (const [i, segment] of segments.entries()) {
      // Enemies you started nearby.
      const startedNear = segments[i - 1]?.endpointEnemies ?? new Set();

      // Enemies you ended near.
      const endpointEnemies = new Set(this.token.document.getHostileTokensFromPoints([segment.at(-1)]));

      // All tokens you passed by (and started near).
      const passedBy = new Set(this.token.document.getHostileTokensFromPoints(segment)).union(startedNear);

      // The number of strikes is equal to the number of tokens you passed by but did not end near.
      const strikes = passedBy.difference(endpointEnemies).size;

      Object.assign(segment, {
        endpointEnemies, strikes,
        count: strikes + (segments[i - 1]?.count ?? 0)
      });
    }

    segments.shift(); // Dont care about the first singleton.

    let index = segments.length - 1;
    let next = waypoint;
    while (next.next) {
      next = next.next;
      index--;
    }

    text = [
      text,
      segments[index]?.count ? `⚔ ${segments[index].count}` : null
    ].filterJoin(" ");
    return {text, alpha, scale};
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  refresh(state) {
    super.refresh(state);

    const points = state.plannedMovement?.[game.user.id]?.foundPath ?? [];
    const tokens = this.token.document.getHostileTokensFromPoints(points);

    for (const {object: token} of tokens) {
      // TODO: add a PIXI element near hostile tokens.
      // const {x, y} = token.center;
      // const circle = new PIXI.Circle(x, y, 10);
      // this.token.layer._rulerPaths.addChild(circle);
    }
  }
}
