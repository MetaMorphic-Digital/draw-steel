export class DrawSteelCombatant extends Combatant {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatantData", this);
  }
}
