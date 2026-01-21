import DrawSteelActiveEffect from "./active-effect.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

/** @import ClassModel from "../data/item/class.mjs" */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Actor.documentClass.
 */
export default class DrawSteelActor extends BaseDocumentMixin(foundry.documents.Actor) {
  /** @inheritdoc */
  static migrateData(data) {
    if (data.type === "character") {
      data.type = "hero";
      foundry.utils.setProperty(data, "flags.draw-steel.migrateType", true);
    }
    return super.migrateData(data);
  }

  /**
   * Is this actor a minion?
   * @returns {boolean}
   */
  get isMinion() {
    return this.system.isMinion ?? false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getRollData() {
    // Shallow copy
    const rollData = { ...this.system, flags: this.flags, name: this.name, statuses: {} };

    for (const status of this.statuses) {
      rollData.statuses[status] = 1;
    }

    if (typeof this.system.modifyRollData === "function") {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // prepare derived item data that relies on derived actor values (i.e. ability potencies)
    for (const item of this.items) {
      item.system.preparePostActorPrepData();
    }

    Hooks.callAll("ds.prepareActorData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Rolls a given actor's characteristic.
   * @param {string} characteristic
   * @param {object} [options] Pass through options object.
   */
  async rollCharacteristic(characteristic, options) {
    if (typeof this.system.rollCharacteristic === "function") return this.system.rollCharacteristic(characteristic, options);
    throw new Error(`Actors of type ${this.type} cannot roll characteristics`);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    switch (attribute) {
      case "stamina": return this.#modifyStamina(value, isDelta);
      case "hero.primary.value": return this.#modifyHeroicResource(value, isDelta);
      default: return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle how changes to Stamina are applied to the Actor.
   * @param {number} value        The target attribute value.
   * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false).
   * @returns {Promise<DrawSteelActor>}    The updated Actor document.
   */
  async #modifyStamina(value, isDelta) {
    const attribute = "stamina";
    const isBar = true;
    const combatGroup = (this.system.combatGroups.size === 1) ? this.system.combatGroup : null;
    if (this.isMinion && combatGroup) {
      const update = isDelta ? combatGroup.system.staminaValue + value : value;
      return combatGroup.update({ "system.staminaValue": update });
    }
    const { value: current, temporary, min, max } = this.system.stamina;
    const delta = isDelta ? (-1 * value) : current + temporary - value;

    if (!delta) return this;

    const updates = {};
    if (delta < 0) {
      // Healing modifies only stamina value
      updates["system.stamina.value"] = Math.clamp(current - delta, min, max);
    } else {
      // Damage first affects temporary stamina, then stamina value
      const tempDamage = Math.min(delta, temporary);
      const valueDamage = Math.max(0, delta - tempDamage);
      updates["system.stamina.temporary"] = Math.max(0, temporary - tempDamage);
      if (valueDamage) updates["system.stamina.value"] = Math.clamp(current - valueDamage, min, max);
    }

    // Allow a hook to override these changes
    const allowed = Hooks.call("modifyTokenAttribute", { attribute, value, isDelta, isBar }, updates, this);
    return allowed !== false ? this.update(updates) : this;
  }

  /* -------------------------------------------------- */

  /**
   * Handle how changes to Heroic Resources are applied to the Actor.
   * @param {number} value        The target attribute value.
   * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false).
   * @returns {Promise<DrawSteelActor>}    The updated Actor document.
   */
  async #modifyHeroicResource(value, isDelta) {
    const attribute = "hero.primary.value";
    const isBar = false;
    const current = foundry.utils.getProperty(this.system, attribute);
    let newValue = isDelta ? current + value : value;
    if (newValue === current) return this;

    /** @type {ClassModel} */
    const classModel = this.system.class?.system;
    if (classModel) {
      const minimum = ds.utils.evaluateFormula(classModel.minimum, classModel.parent.getRollData());
      newValue = Math.max(minimum, newValue);
    }

    // Determine the updates to make to the actor data
    const updates = { [`system.${attribute}`]: newValue };

    // Allow a hook to override these changes
    const allowed = Hooks.call("modifyTokenAttribute", { attribute, value, isDelta, isBar }, updates, this);
    return allowed !== false ? this.update(updates) : this;
  }

  /* -------------------------------------------------- */

  /**
   * Toggle a configured status effect for the Actor.
   * @param {string} statusId       A status effect ID defined in CONFIG.statusEffects.
   * @param {object} [options={}]   Additional options which modify how the effect is created.
   * @param {boolean} [options.active]          Force the effect to be active or inactive regardless of its current state.
   * @param {boolean} [options.overlay=false]   Display the toggled effect as an overlay.
   * @param {string} [options.effectEnd]        Value for `system.end.type`.
   * @returns {Promise<DrawSteelActiveEffect|boolean|undefined>}  A promise which resolves to one of the following values:
   *                                 - ActiveEffect if a new effect need to be created
   *                                 - true if was already an existing effect
   *                                 - false if an existing effect needed to be removed
   *                                 - undefined if no changes need to be made.
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
