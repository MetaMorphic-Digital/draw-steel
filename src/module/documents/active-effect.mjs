export class DrawSteelActiveEffect extends ActiveEffect {

  /**
   * Automatically deactivate effects with expired durations
   * @type {Boolean}
   */
  get isSuppressed() {
    if (Number.isNumeric(this.duration.remaining)) {
      return this.duration.remaining <= 0;
    }
    return false;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
  }
}
