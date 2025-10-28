import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import PowerRoll from "../../rolls/power.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { damageTypes, requiredInteger, setOptions } from "../helpers.mjs";
import SizeModel from "../models/size.mjs";
import { systemID } from "../../constants.mjs";
import DrawSteelSystemModel from "../system-model.mjs";

/**
 * @import { DataField } from "@common/data/fields.mjs";
 * @import { DrawSteelActor, DrawSteelCombatant, DrawSteelCombatantGroup } from "../../documents/_module.mjs";
 * @import AbilityModel from "../item/ability.mjs";
 * @import { CoreResource } from "./_types";
 * @import { AbilityBonus } from "../_types";
 */

const fields = foundry.data.fields;

/**
 * A base actor model that provides common properties for both heroes and npcs.
 */
export default class BaseActorModel extends DrawSteelSystemModel {
  /** @inheritdoc */
  static defineSchema() {
    const characteristic = { initial: 0, integer: true, nullable: false };
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
      save: new fields.SchemaField({
        threshold: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, max: 10, initial: 6 }),
        bonus: new FormulaField(),
      }),
      size: new fields.EmbeddedDataField(SizeModel),
      stability: requiredInteger(),
      turns: requiredInteger({ initial: 1 }),
    });

    schema.biography = new fields.SchemaField(this.actorBiography());

    schema.movement = new fields.SchemaField({
      value: new fields.NumberField({ nullable: false, integer: true, min: 0, initial: 5 }),
      types: new fields.SetField(setOptions(), { initial: ["walk"] }),
      hover: new fields.BooleanField(),
      disengage: new fields.NumberField({ nullable: false, integer: true, min: 0, initial: 1 }),
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, { all: true }),
      weaknesses: damageTypes(requiredInteger, { all: true }),
    });

    schema.conditions = new fields.SchemaField({
      immunities: new fields.SetField(setOptions()),
      unflankable: new fields.BooleanField({ initial: false }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Actor.base"];

  /* -------------------------------------------------- */

  /**
   * Helper function to fill in the `biography` property.
   * @protected
   * @returns {Record<string, DataField>}
   */
  static actorBiography() {
    return {
      value: new fields.HTMLField(),
      director: new fields.HTMLField({ gmOnly: true }),
      languages: new fields.SetField(setOptions()),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Array for tracking bonuses to abilities that this actor has.
   * @type {AbilityBonus[]}
   * @internal
   */
  _abilityBonuses = [];

  /* -------------------------------------------------- */

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

    Object.assign(this.stamina, {
      min: 0,
      bonuses: {
        echelon: 0,
      },
    });

    Object.assign(this.movement, {
      // Teleport speeds are unaffected by conditions and effects
      teleport: this.movement.types.has("teleport") ? this.movement.value : null,
      // Kit bonus is added in derived data, which means multipliers need to happen after
      // Can consider removing in v14 after phases are introduced
      multiplier: 1,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Account for immunities first, in case any changes impact later calculations
    this.conditions.immunities.forEach(imm => this.parent.statuses.delete(imm));

    // Apply all stamina bonuses before calculating winded
    this.stamina.max += this.echelon * this.stamina.bonuses.echelon;

    this.stamina.winded = Math.floor(this.stamina.max / 2);

    // Presents better if there's a 0 instead of blank
    this.combat.save.bonus ||= "0";

    this.movement.value = Math.floor(this.movement.value * this.movement.multiplier);

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
  }

  /* -------------------------------------------------- */

  /**
   * Perform actor subtype specific modifications to the actor roll data.
   * @param {object} rollData   Pointer to the roll data object after all iterable properties of this class have been assigned as a shallow copy.
   */
  modifyRollData(rollData) {
    for (const [key, obj] of Object.entries(this.characteristics)) {
      const rollKey = ds.CONFIG.characteristics[key].rollKey;
      rollData[rollKey] = obj.value;
    }

    rollData.echelon = this.echelon;
    rollData.level = this.level;
  }

  /* -------------------------------------------------- */

  /**
   * The actor's level.
   */
  get level() {
    return 1;
  }

  /* -------------------------------------------------- */

  /**
   * The actor's echelon based on their current level.
   */
  get echelon() {
    return Object.entries(ds.CONFIG.echelons).reduce((acc, [key, value]) => {
      return this.level >= value.threshold ? Number(key) : acc;
    }, 1);
  }

  /* -------------------------------------------------- */

  /**
   * Is this actor a minion?
   * @returns {boolean}
   */
  get isMinion() {
    return false;
  }

  /* -------------------------------------------------- */

  /**
   * Returns a Set of all combatant groups this actor is a part of.
   * @returns {Set<DrawSteelCombatantGroup>}
   */
  get combatGroups() {
    const combatants = game.combat?.getCombatantsByActor(this.parent) ?? [];
    // The root actor will match to *all* unlinked tokens, so need to check against that
    const actorMatches = combatants.filter(c => c.actor === this.parent);
    const groups = actorMatches.map(c => c.group).filter(g => !!g);
    return new Set(groups);
  }

  /* -------------------------------------------------- */

  /**
   * Returns the first combatant group in all of the actor's combatant groups.
   * @returns {DrawSteelCombatantGroup | null}
   */
  get combatGroup() {
    return this.combatGroups.first() || null;
  }

  /* -------------------------------------------------- */

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

    if (changes.system?.stamina) {
      options.ds ??= {};
      options.ds.previousStamina = { ...this.stamina };
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {object} changed            The differential data that was changed relative to the documents prior values.
   * @param {object} options            Additional options which modify the update request.
   * @param {string} userId             The id of the User requesting the document update.
   * @protected
   * @internal
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if ((game.userId === userId) && changed.system?.stamina) this.updateStaminaEffects();

    if (options.ds?.previousStamina && changed.system?.stamina) {
      const stamDiff = options.ds.previousStamina.value - (changed.system.stamina.value || options.ds.previousStamina.value);
      const tempDiff = options.ds.previousStamina.temporary - (changed.system.stamina.temporary || options.ds.previousStamina.temporary);
      const diff = stamDiff + tempDiff;
      this.displayStaminaChange(diff, options.ds.damageType);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Update the stamina effects based on updated stamina values.
   */
  async updateStaminaEffects() {
    for (const [key, value] of Object.entries(ds.CONST.staminaEffects)) {
      let threshold = (Number.isNumeric(value.threshold)) ? value.threshold : foundry.utils.getProperty(this.parent, value.threshold);
      threshold = Number(threshold);

      const active = Number.isNumeric(threshold) && (this.stamina.value <= threshold);
      await this.parent.toggleStatusEffect(key, { active });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Display actor stamina changes on active tokens.
   *
   * @param {number} diff The amount the actor's stamina has changed.
   * @param {string} [damageType=""] The type of damage being dealt.
   */
  async displayStaminaChange(diff, damageType = "") {
    if (!diff || !canvas.scene) {
      return;
    }

    const damageColor = ds.CONFIG.damageTypes[damageType]?.color ?? null;
    const tokens = this.parent.getActiveTokens();
    const displayedDiff = (-1 * diff).signedString();
    const defaultFill = (diff < 0 ? "lightgreen" : "white");
    const displayArgs = {
      fill: damageColor ?? defaultFill,
      fontSize: 32,
      stroke: 0x000000,
      strokeThickness: 4,
    };

    tokens.forEach((token) => {
      if (!token.visible || token.document.isSecret) {
        return;
      }

      const scrollingTextArgs = [
        token.center,
        displayedDiff,
        displayArgs,
      ];

      canvas.interface.createScrollingText(...scrollingTextArgs);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Updates performed at the start of combat.
   * @param {DrawSteelCombatant} combatant The combatant representation.
   */
  async startCombat(combatant) {
    if (!game.combats.isDefaultInitiativeMode) return;
    await combatant.update({ initiative: this.combat.turns });
  }

  /* -------------------------------------------------- */

  /**
   * Updates performed at the start of this actor's turn.
   * @param {DrawSteelCombatant} combatant The combatant representation.
   * @abstract
   */
  async _onStartTurn(combatant) {}

  /* -------------------------------------------------- */

  /**
   * Prompt the user for what types.
   * @param {string} characteristic   The characteristic to roll.
   * @param {object} [options]        Options to modify the characteristic roll.
   * @param {Array<"test" | "ability">} [options.types] Valid roll types for the characteristic.
   * @param {number} [options.edges]                    Base edges for the roll.
   * @param {number} [options.banes]                    Base banes for the roll.
   * @param {number} [options.bonuses]                  Base bonuses for the roll.
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
        window: { title: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Title") },
        content: game.i18n.localize("DRAW_STEEL.ROLL.Power.ChooseType.Content"),
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

  /* -------------------------------------------------- */

  /**
   * Deal damage to the actor, accounting for immunities and resistances.
   * @param {number} damage    The amount of damage to take.
   * @param {object} [options] Options to modify the damage application.
   * @param {string} [options.type]   Valid damage type.
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore.
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

    const damageTypeOption = { ds: { damageType: options.type } };
    if (this.isMinion) {
      const combatGroups = this.combatGroups;
      if (combatGroups.size === 1) {
        return this.combatGroup.update({ "system.staminaValue": this.combatGroup.system.staminaValue - damage }, damageTypeOption);
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

    return this.parent.update({ "system.stamina": staminaUpdates }, damageTypeOption);
  }

  /* -------------------------------------------------- */

  /**
   * Fetch information about the core resource for this actor subtype.
   * @see {@linkcode AbilityModel.use | AbilityModel#use}
   * @abstract
   * @returns {CoreResource}
   */
  get coreResource() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Update the core resource for this actor subtype.
   * @see {@linkcode AbilityModel.use | AbilityModel#use}
   * @param {number} delta Change in value.
   */
  async updateResource(delta) {
    throw new Error("This method is abstract and must be implemented by a subclass");
  }
}
