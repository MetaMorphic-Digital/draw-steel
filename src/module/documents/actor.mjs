/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class DrawSteelActor extends Actor {
  /** @override */
  getRollData() {
    // Shallow copy
    const rollData = {...this.system};

    return rollData;
  }
}
