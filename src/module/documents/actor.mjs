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

  /**
   * Rolls a given actor's characteristic
   * @param {string} characteristic
   * @param {object} [options] Pass through options object
   * @returns
   */
  async rollCharacteristic(characteristic, options) {
    if (this.system.rollCharacteristic instanceof Function) return this.system.rollCharacteristic(options);
    throw new Error(`Actors of type ${this.type} cannot roll characteristics`);
  }
}
