export class DrawSteelCombat extends Combat {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatData", this);
  }
}
