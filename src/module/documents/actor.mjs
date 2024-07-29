export class DrawSteelActor extends Actor {
  /** @override */
  getRollData() {
    // Shallow copy
    const rollData = {...this.system};

    return rollData;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActorData", this);
  }
}
