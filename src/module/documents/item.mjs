/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DrawSteelItem extends Item {

  /** @override */
  getRollData() {
    // Shallow copy
    const rollData = {...this.system};

    if (!this.actor) return rollData;

    rollData.actor = this.actor.getRollData();

    return rollData;
  }
}
