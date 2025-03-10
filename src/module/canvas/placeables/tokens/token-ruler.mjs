export default class DrawSteelTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  /** @inheritdoc */
  _getWaypointLabel(waypoint) {
    if ((waypoint.stage === "passed") || !waypoint.previous || (waypoint.previous.stage === "passed")) {
      return super._getWaypointLabel(waypoint);
    }

    let {text, alpha, scale} = super._getWaypointLabel(waypoint);
    const segments = this.token.segmentizedFoundPath;
    const tokens = new Set();
    const ignored = new Set();
    for (const [i, segment] of segments.entries()) {
      const strikes = this.token.document.getHostileTokensFromPoints(segment);
      for (const token of strikes) {
        if (!i) ignored.add(token);
        else if (!ignored.has(token)) tokens.add(token);
      }
      Object.assign(segment, {count: tokens.size});
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
