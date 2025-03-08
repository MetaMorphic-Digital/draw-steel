/** @import {DrawSteelCombatant} from "../../documents/combatant.mjs"; */
/** @import AbilityModel from "../item/ability.mjs" */
/** @import DataModel from "../../../../foundry/common/abstract/data.mjs" */
import {DrawSteelChatMessage} from "../../documents/chat-message.mjs";
import {PowerRoll} from "../../rolls/power.mjs";
import {damageTypes, requiredInteger, setOptions} from "../helpers.mjs";
import SizeModel from "../models/size.mjs";
const fields = foundry.data.fields;

/**
 * A base actor model that provides common properties for both characters and npcs
 */
export default class BaseActorModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Actor subtype
   */
  static metadata = Object.freeze({});

  /** @override */
  static defineSchema() {
    const characteristic = {min: -5, max: 5, initial: 0, integer: true};
    const schema = {};

    schema.stamina = new fields.SchemaField({
      value: new fields.NumberField({initial: 20, nullable: false, integer: true}),
      max: new fields.NumberField({initial: 20, nullable: false, integer: true}),
      temporary: new fields.NumberField({integer: true})
    });

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, {label, hint}]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({...characteristic, label, hint})
        });
        return obj;
      }, {})
    );

    schema.combat = new fields.SchemaField({
      size: new fields.EmbeddedDataField(SizeModel),
      stability: requiredInteger({initial: 0}),
      turns: requiredInteger({initial: 1})
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    schema.movement = new fields.SchemaField({
      walk: new fields.NumberField({integer: true, min: 0, initial: 5}),
      burrow: new fields.NumberField({integer: true, min: 0}),
      climb: new fields.NumberField({integer: true, min: 0}),
      swim: new fields.NumberField({integer: true, min: 0}),
      fly: new fields.NumberField({integer: true, min: 0}),
      teleport: new fields.NumberField({integer: true, min: 0})
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, {all: true}),
      weaknesses: damageTypes(requiredInteger, {all: true})
    });

    return schema;
  }

  /**
   * Helper function to fill in the `biography` property
   * @protected
   * @returns {Record<string, fields["DataField"]}
   */
  static actorBiography() {
    return {
      value: new fields.HTMLField(),
      gm: new fields.HTMLField(),
      languages: new fields.SetField(setOptions())
    };
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    this.potency = {
      bonuses: 0
    };

    this.statuses = {
      slowed: {
        speed: CONFIG.statusEffects.find(e => e.id === "slowed").defaultSpeed
      }
    };

    this.restrictions = {
      type: new Set(),
      dsid: new Set()
    };
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.stamina.winded = Math.floor(this.stamina.max / 2);

    // Set movement speeds when affected by grabbed, restrained, or slowed
    const isSlowed = this.parent.statuses.has("slowed");
    const isGrabbedOrRestrained = this.parent.statuses.has("grabbed") || this.parent.statuses.has("restrained");
    if (isSlowed || isGrabbedOrRestrained) {
      for (const movement in this.movement) {
        // If slowed, set all speeds to slowed speed
        if (isSlowed && (this.movement[movement] > this.statuses.slowed.speed)) this.movement[movement] = this.statuses.slowed.speed;

        // If grabbed or restrained, set non-teleport speeds to 0
        if (isGrabbedOrRestrained && (movement !== "teleport")) this.movement[movement] = 0;
      }
    }

    // prepare derived item data that relies on derived actor values (i.e. ability potencies)
    for (const item of this.parent.items) {
      item.system.preparePostActorPrepData();
    }
  }

  /**
   * Perform actor subtype specific modifications to the actor roll data
   * @param {object} rollData   Pointer to the roll data object after all iterable properties of this class have been assigned as a shallow copy
   */
  modifyRollData(rollData) {
    for (const [key, obj] of Object.entries(this.characteristics)) {
      const rollKey = ds.CONFIG.characteristics[key].rollKey;
      rollData[rollKey] = obj.value;
    }

    rollData.echelon = this.echelon;
  }

  /**
   * The actor's melee range
   */
  get reach() {
    return 1;
  }

  /**
   * The actor's level
   */
  get level() {
    return 1;
  }

  /**
   * The actor's echelon based on their current level
   */
  get echelon() {
    return Object.entries(ds.CONFIG.echelons).reduce((acc, [key, value]) => {
      return this.level >= value.threshold ? Number(key) : acc;
    }, 1);
  }

  /**
   * @override
   * @param {Record<string, unknown>} changes
   * @param {import("../../../../foundry/common/abstract/_types.mjs").DatabaseUpdateOperation} operation
   * @param {User} user
   */
  _preUpdate(changes, operation, user) {
    const newSize = foundry.utils.getProperty(changes, "system.combat.size.value");
    if ((newSize !== undefined) && (this.combat.size.value !== newSize)) {
      foundry.utils.mergeObject(changes, {
        prototypeToken: {
          width: newSize,
          height: newSize
        }
      });
    }
  }

  /**
   * @override
   * @param {object} changed            The differential data that was changed relative to the documents prior values
   * @param {object} options            Additional options which modify the update request
   * @param {string} userId             The id of the User requesting the document update
   * @protected
   * @internal
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if ((game.userId === userId) && changed.system?.stamina) this.updateStaminaEffects();
  }

  /**
   * Update the stamina effects based on updated stamina values
   */
  async updateStaminaEffects() {
    for (const [key, value] of Object.entries(ds.CONST.staminaEffects)) {
      let threshold = (Number.isNumeric(value.threshold)) ? value.threshold : foundry.utils.getProperty(this.parent, value.threshold);
      threshold = Number(threshold);

      const active = Number.isNumeric(threshold) && (this.stamina.value <= threshold);
      await this.parent.toggleStatusEffect(key, {active});
    }
  }

  /**
   * Updates performed at the start of combat
   * @param {DrawSteelCombatant} combatant The combatant representation
   */
  async startCombat(combatant) {
    await combatant.update({initiative: this.combat.turns});
  }

  /**
   * Updates performed at the start of this actor's turn
   * @param {DrawSteelCombatant} combatant The combatant representation
   * @abstract
   */
  async _onStartTurn(combatant) {}

  /**
   * Prompt the user for what types
   * @param {string} characteristic   The characteristic to roll
   * @param {object} [options]        Options to modify the characteristic roll
   * @param {Array<"test" | "ability">} [options.types] Valid roll types for the characteristic
   * @param {number} [options.edges]                    Base edges for the roll
   * @param {number} [options.banes]                    Base banes for the roll
   * @param {number} [options.bonuses]                  Base bonuses for the roll
   * @returns {Promise<DrawSteelChatMessage>}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const types = options.types ?? ["test"];

    let type = types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const {label, icon} = PowerRoll.TYPES[action];
        b.push({label, icon, action});
        return b;
      }, []);
      type = await foundry.applications.api.DialogV2.wait({
        window: {title: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Title")},
        content: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Content"),
        buttons,
        rejectClose: true
      });
    }
    const skills = this.hero?.skills ?? null;

    const evaluation = "evaluate";
    const formula = `2d10 + @${characteristic}`;
    const data = this.parent.getRollData();
    const flavor = `${game.i18n.localize(`DRAW_STEEL.Actor.characteristics.${characteristic}.full`)} ${game.i18n.localize(PowerRoll.TYPES[type].label)}`;
    const modifiers = {
      edges: options.edges ?? 0,
      banes: options.banes ?? 0,
      bonuses: options.bonuses ?? 0
    };

    const rolls = await PowerRoll.prompt({type, evaluation, formula, data, flavor, modifiers, actor: this.parent, characteristic, skills});
    return DrawSteelChatMessage.create({
      speaker: DrawSteelChatMessage.getSpeaker({actor: this.parent}),
      rolls
    });
  }

  /**
   * Deal damage to the actor, accounting for immunities and resistances
   * @param {number} damage    The amount of damage to take
   * @param {object} [options] Options to modify the damage application
   * @param {string} [options.type]   Valid damage type
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore
   * @returns {Promise<Actor>}
   */
  async takeDamage(damage, options = {}) {
    // Determine highest weakness between all weakness and the damage's type weakness
    const allWeakness = this.damage.weaknesses.all;
    const specificWeakness = this.damage.weaknesses[options.type] ?? 0; // Null check in case the damage type is untyped
    const weaknessAmount = Math.max(allWeakness, specificWeakness);

    options.ignoredImmunities ??= [];
    // Reduce the immunities list to non-ignored immunities
    const immunities = Object.entries(this.damage.immunities).reduce((acc, [type, amount]) => {
      if (!options.ignoredImmunities.includes("all") && !options.ignoredImmunities.includes(type)) acc[type] = amount;
      return acc;
    }, {});
    const immunityAmount = Math.max(immunities.all ?? 0, immunities[options.type] ?? 0); // Null check in case type is not in immunities

    damage = Math.max(0, damage + weaknessAmount - immunityAmount);

    if (damage === 0) {
      ui.notifications.info("DRAW_STEEL.Actor.DamageNotification.ImmunityReducedToZero", {format: {name: this.parent.name}});
      return this.parent;
    }

    // If there's damage left after weakness/immunities, apply damage to temporary stamina then stamina value
    const staminaUpdates = {};
    const damageToTempStamina = Math.min(damage, this.stamina.temporary);
    staminaUpdates.temporary = Math.max(0, this.stamina.temporary - damageToTempStamina);

    const remainingDamage = Math.max(0, damage - damageToTempStamina);
    if (remainingDamage > 0) staminaUpdates.value = this.stamina.value - remainingDamage;

    return this.parent.update({"system.stamina": staminaUpdates});
  }

  /**
   * Fetch information about the core resource for this actor subtype.
   * {@link AbilityModel#use}
   * @abstract
   * @returns {{
   *  name: string;
   *  target: DataModel;
   *  path: string;
   * }}
   */
  get coreResource() {
    return null;
  }

  /**
   * Update the core resource for this actor subtype
   * {@link AbilityModel#use}
   * @param {number} delta Change in value
   */
  async updateResource(delta) {
    throw new Error("This method is abstract and must be implemented by a subclass");
  }
}
