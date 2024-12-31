export class DrawSteelItem extends Item {

  /** @override */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};

    rollData.itemFlags = this.flags;

    // Shallow copy
    rollData.item = this.system;

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareItemData", this);
  }
}
