import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import { PowerRoll } from "../../rolls/power.mjs";
import { damageTypes, requiredInteger, setOptions } from "../helpers.mjs";
import SizeModel from "../models/size.mjs";
import SubtypeModelMixin from "../subtype-model-mixin.mjs";

/** @import { DrawSteelActor, DrawSteelCombatant, DrawSteelCombatantGroup } from "../../documents/_module.mjs"; */
/** @import AbilityModel from "../item/ability.mjs" */
/** @import DataModel from "@common/abstract/data.mjs" */

const fields = foundry.data.fields;

/**
 * A base actor model that provides common properties for both characters and npcs
 */
export default class BaseActorModel extends SubtypeModelMixin(foundry.abstract.TypeDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    const characteristic = { min: -5, max: 5, initial: 0, integer: true };
    const schema = {};

    schema.stamina = new fields.SchemaField({
      value: new fields.NumberField({ initial: 20, nullable: false, integer: true }),
      max: new fields.NumberField({ initial: 20, nullable: false, integer: true }),
      temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
    });

    schema.characteristics = new fields.SchemaField(
      Object.entries(ds.CONFIG.characteristics).reduce((obj, [chc, { label, hint }]) => {
        obj[chc] = new fields.SchemaField({
          value: new fields.NumberField({ ...characteristic, label, hint }),
        });
        return obj;
      }, {}),
    );

    schema.combat = new fields.SchemaField({
      size: new fields.EmbeddedDataField(SizeModel),
      stability: requiredInteger({ initial: 0 }),
      turns: requiredInteger({ initial: 1 }),
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    schema.movement = new fields.SchemaField({
      value: new fields.NumberField({ integer: true, min: 0, initial: 5 }),
      types: new fields.SetField(setOptions(), { initial: ["walk"] }),
      hover: new fields.BooleanField(),
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, { all: true }),
      weaknesses: damageTypes(requiredInteger, { all: true }),
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
      languages: new fields.SetField(setOptions()),
    };
  }

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.potency = {
      bonuses: 0,
      weak: 0,
      average: 0,
      strong: 0,
    };

    this.statuses = {
      slowed: {
        speed: CONFIG.statusEffects.find(e => e.id === "slowed").defaultSpeed,
      },
    };

    this.restrictions = {
      type: new Set(),
      dsid: new Set(),
    };

    this.stamina.min = 0;

    // Teleport speeds are unaffected by conditions and effects
    this.movement.teleport = this.movement.types.has("teleport") ? this.movement.value : null;
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.stamina.winded = Math.floor(this.stamina.max / 2);

    const highestCharacteristic = Math.max(0, ...Object.values(this.characteristics).map(c => c.value));

    this.potency.weak += highestCharacteristic - 2 + this.potency.bonuses;
    this.potency.average += highestCharacteristic - 1 + this.potency.bonuses;
    this.potency.strong += highestCharacteristic + this.potency.bonuses;

    // Add restrictions based on status effects
    for (const effect of CONFIG.statusEffects) {
      if (!this.parent.statuses.has(effect.id) || !effect.restrictions) continue;

      effect.restrictions.type?.forEach(t => this.restrictions.type.add(t));
      effect.restrictions.dsid?.forEach(d => this.restrictions.dsid.add(d));
    }

    // Set movement speeds when affected by grabbed, restrained, or slowed
    const isSlowed = this.parent.statuses.has("slowed");
    const isGrabbedOrRestrained = this.parent.statuses.has("grabbed") || this.parent.statuses.has("restrained");
    if (isSlowed || isGrabbedOrRestrained) {
      // If slowed, set all speeds to slowed speed
      if (isSlowed && (this.movement.value > this.statuses.slowed.speed)) this.movement.value = this.statuses.slowed.speed;
      if (isGrabbedOrRestrained) this.movement.value = 0;
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
    rollData.level = this.level;
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
   * Is this actor a minion?
   * @returns {boolean}
   */
  get isMinion() {
    return false;
  }

  /**
   * Returns a Set of all combatant groups this actor is a part of
   * @returns {Set<DrawSteelCombatantGroup>}
   */
  get combatGroups() {
    return new Set(game.combat?.getCombatantsByActor(this.parent).map(c => c.group).filter(group => !!group) ?? []);
  }

  /**
   * Returns the first combatant group in all of the actor's combatant groups.
   * @returns {DrawSteelCombatantGroup | null}
   */
  get combatGroup() {
    return this.combatGroups.first() || null;
  }

  /**
   * @inheritdoc
   * @param {Record<string, unknown>} changes
   * @param {import("@common/abstract/_types.mjs").DatabaseUpdateOperation} operation
   * @param {User} user
   */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    const newSize = foundry.utils.getProperty(changes, "system.combat.size.value");
    if ((newSize !== undefined) && (this.combat.size.value !== newSize)) {
      foundry.utils.mergeObject(changes, {
        prototypeToken: {
          width: newSize,
          height: newSize,
        },
      });
    }
  }

  /**
   * @inheritdoc
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
      await this.parent.toggleStatusEffect(key, { active });
    }
  }

  /**
   * Updates performed at the start of combat
   * @param {DrawSteelCombatant} combatant The combatant representation
   */
  async startCombat(combatant) {
    await combatant.update({ initiative: this.combat.turns });
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
   * @returns {Promise<DrawSteelChatMessage | null>}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const types = options.types ?? ["test"];

    let type = types[0];

    if (types.length > 1) {
      const buttons = types.reduce((b, action) => {
        const { label, icon } = PowerRoll.TYPES[action];
        b.push({ label, icon, action });
        return b;
      }, []);
      type = await ds.applications.api.DSDialog.wait({
        window: { title: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Title") },
        content: game.i18n.localize("DRAW_STEEL.Roll.Power.ChooseType.Content"),
        buttons,
        rejectClose: true,
      });
    }
    const skills = this.hero?.skills ?? null;

    const evaluation = "evaluate";
    const formula = `2d10 + @${ds.CONFIG.characteristics[characteristic].rollKey}`;
    const data = this.parent.getRollData();
    const flavor = `${game.i18n.localize(`DRAW_STEEL.Actor.characteristics.${characteristic}.full`)} ${game.i18n.localize(PowerRoll.TYPES[type].label)}`;
    const modifiers = {
      edges: options.edges ?? 0,
      banes: options.banes ?? 0,
      bonuses: options.bonuses ?? 0,
    };

    const promptValue = await PowerRoll.prompt({ type, evaluation, formula, data, flavor, modifiers, actor: this.parent, characteristic, skills });

    if (!promptValue) return null;
    const { rollMode, powerRolls } = promptValue;

    const messageData = {
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
      rolls: powerRolls,
      sound: CONFIG.sounds.dice,
      flags: { core: { canPopout: true } },
    };
    DrawSteelChatMessage.applyRollMode(messageData, rollMode);
    return DrawSteelChatMessage.create(messageData);
  }

  /**
   * Deal damage to the actor, accounting for immunities and resistances
   * @param {number} damage    The amount of damage to take
   * @param {object} [options] Options to modify the damage application
   * @param {string} [options.type]   Valid damage type
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore
   * @returns {Promise<DrawSteelActor | DrawSteelCombatantGroup>}
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
      ui.notifications.info("DRAW_STEEL.Actor.DamageNotification.ImmunityReducedToZero", { format: { name: this.parent.name } });
      return this.parent;
    }

    if (this.isMinion) {
      const combatGroups = this.combatGroups;
      if (combatGroups.size === 1) {
        return this.combatGroup.update({ "system.staminaValue": this.combatGroup.system.staminaValue - damage });
      }
      else if (combatGroups.size === 0) {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.MinionNoSquad", { localize: true });
      }
      else {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.TooManySquad", { localize: true });
      }
    }
    // If there's damage left after weakness/immunities, apply damage to temporary stamina then stamina value
    const staminaUpdates = {};
    const damageToTempStamina = Math.min(damage, this.stamina.temporary);
    staminaUpdates.temporary = Math.max(0, this.stamina.temporary - damageToTempStamina);

    const remainingDamage = Math.max(0, damage - damageToTempStamina);
    if (remainingDamage > 0) staminaUpdates.value = this.stamina.value - remainingDamage;

    return this.parent.update({ "system.stamina": staminaUpdates });
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
