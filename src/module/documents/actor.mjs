export class DrawSteelActor extends Actor {
  /**
   * Is this actor a minion?
   * @returns {boolean}
   */
  get isMinion() {
    return foundry.utils.getProperty(this, "system.monster.organization") === "minion";
  }

  /** @inheritdoc */
  getRollData() {
    // Shallow copy
    const rollData = {...this.system, flags: this.flags, name: this.name, statuses: {}};

    for (const status of this.statuses) {
      rollData.statuses[status] = 1;
    }

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /** @inheritdoc */
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
    if (this.system.rollCharacteristic instanceof Function) return this.system.rollCharacteristic(characteristic, options);
    throw new Error(`Actors of type ${this.type} cannot roll characteristics`);
  }
}
