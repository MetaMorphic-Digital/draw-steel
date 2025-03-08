export default class DrawSteelTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  /** @inheritdoc */
  _getWaypointLabel(waypoint) {
    let {text, alpha, scale} = super._getWaypointLabel(waypoint);
    const points = this.token._rulerData?.[game.user.id]?.foundPath ?? [];
    const freeStrikes = this.token.document.getHostileTokensFromPoints(points);
    text = [
      text,
      freeStrikes.length ? `⚔ ${freeStrikes.length}` : null
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
