import BaseDocumentMixin from "./base-document-mixin.mjs";

// Necessary for continued type functionality with mixin
/** @import Actor from "@client/documents/actor.mjs"; */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Actor.documentClass
 */
export default class DrawSteelActor extends BaseDocumentMixin(foundry.documents.Actor) {
  /**
   * Is this actor a minion?
   * @returns {boolean}
   */
  get isMinion() {
    return this.system.isMinion ?? false;
  }

  /** @inheritdoc */
  getRollData() {
    // Shallow copy
    const rollData = { ...this.system, flags: this.flags, name: this.name, statuses: {} };

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

  /** @inheritdoc*/
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    if (attribute !== "stamina") return super.modifyTokenAttribute(attribute, value, isDelta, isBar);

    const combatGroup = (this.system.combatGroups.size === 1) ? this.system.combatGroup : null;
    const current = (this.isMinion && combatGroup) ? combatGroup.system.staminaValue : this.system.stamina.value;
    const update = isDelta ? current + value : value;

    if (this.isMinion && combatGroup) return combatGroup.update({ "system.staminaValue": update });

    if (update === current) return this;

    // Determine the updates to make to the actor data
    const updates = { "system.stamina.value": Math.clamp(update, this.system.stamina.min, this.system.stamina.max) };

    // Allow a hook to override these changes
    const allowed = Hooks.call("modifyTokenAttribute", { attribute, value, isDelta, isBar }, updates, this);
    return allowed !== false ? this.update(updates) : this;
  }
}
