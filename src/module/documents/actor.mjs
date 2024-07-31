export class DrawSteelActor extends Actor {
  /** @override */
  getRollData() {
    // Shallow copy
    const rollData = {...this.system};

    if ("characteristics" in this.system) {
      for (const [key, obj] of Object.entries(this.system.characteristics)) {
        rollData[key] = obj.value;
      }
    }

    return rollData;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareActorData", this);
  }
}
