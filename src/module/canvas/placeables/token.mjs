/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass
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

  /**
   * The current ruler data path, segmentized.
   * @returns {object[][]}    Waypoints split into segments.
   */
  get segmentizedFoundPath() {
    const path = this._rulerData[game.user.id]?.foundPath ?? [];
    const segments = path.reduce((acc, waypoint) => {
      acc.at(-1).push(waypoint);
      if (!waypoint.intermediate) acc.push([]);
      return acc;
    }, [[]]);
    segments.pop();
    return segments;
  }

  /** @inheritdoc*/
  _drawBar(number, bar, data) {
    if (data.attribute !== "stamina") return super._drawBar(number, bar, data);

    const stamina = Number(data.value);

    // Creates a normalized range of 0 to (max stamina - min stamina) used for calculating the token bar percentage
    // Needed to handle character's negative stamina
    const minimumStamina = this.actor.system.stamina.min;
    const totalStamina = data.max - minimumStamina;
    const adjustedValue = stamina - minimumStamina;
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
      const colorPct = Math.clamp(adjustedValue, 0, Math.abs(minimumStamina)) / Math.abs(minimumStamina);
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
