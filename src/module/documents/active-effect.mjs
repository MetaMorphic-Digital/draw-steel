export class DrawSteelActiveEffect extends ActiveEffect {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActiveEffectData", this);
  }
}
