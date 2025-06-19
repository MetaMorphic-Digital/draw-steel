import DrawSteelActiveEffect from "./active-effect.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

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

  /**
   * Toggle a configured status effect for the Actor.
   * @param {string} statusId       A status effect ID defined in CONFIG.statusEffects
   * @param {object} [options={}]   Additional options which modify how the effect is created
   * @param {boolean} [options.active]        Force the effect to be active or inactive regardless of its current state
   * @param {boolean} [options.overlay=false] Display the toggled effect as an overlay
   * @param {string} [options.effectEnd]      Value for `system.end.type`
   * @returns {Promise<DrawSteelActiveEffect|boolean|undefined>}  A promise which resolves to one of the following values:
   *                                 - ActiveEffect if a new effect need to be created
   *                                 - true if was already an existing effect
   *                                 - false if an existing effect needed to be removed
   *                                 - undefined if no changes need to be made
   * @override Implementation copied from core.
   */
  async toggleStatusEffect(statusId, { active, overlay = false, effectEnd = "" } = {}) {
    const status = CONFIG.statusEffects.find(e => e.id === statusId);
    if (!status) throw new Error(`Invalid status ID "${statusId}" provided to Actor#toggleStatusEffect`);
    const existing = [];

    // Find the effect with the static _id of the status effect
    if (status._id) {
      const effect = this.effects.get(status._id);
      if (effect) existing.push(effect.id);
    }

    // If no static _id, find all single-status effects that have this status
    else {
      for (const effect of this.effects) {
        const statuses = effect.statuses;
        if ((statuses.size === 1) && statuses.has(status.id)) existing.push(effect.id);
      }
    }

    // Remove the existing effects unless the status effect is forced active
    if (existing.length) {
      if (active) return true;
      await this.deleteEmbeddedDocuments("ActiveEffect", existing);
      return false;
    }

    // Create a new effect unless the status effect is forced inactive
    if (!active && (active !== undefined)) return;
    const effect = await DrawSteelActiveEffect.fromStatusEffect(statusId);
    if (overlay) effect.updateSource({ "flags.core.overlay": true });
    if (effectEnd) effect.updateSource({ "system.end.type": effectEnd });
    return DrawSteelActiveEffect.create(effect, { parent: this, keepId: true });
  }
}
