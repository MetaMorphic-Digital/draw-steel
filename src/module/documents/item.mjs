export class DrawSteelItem extends Item {

  /** @override */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};

    // Shallow copy
    rollData.item = {...this.system};

    return rollData;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareItemData", this);
  }
}
