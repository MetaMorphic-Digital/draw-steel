import { damageTypes, requiredInteger, setOptions } from "../helpers.mjs";
import DrawSteelSystemModel from "../system-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import SizeModel from "../models/size.mjs";

/**
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
    const schema = {};

    schema.stamina = new fields.SchemaField({
      value: new fields.NumberField({ initial: null, nullable: true, integer: true }),
      max: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      min: requiredInteger({ persisted: false }),
      bonuses: new fields.SchemaField({
        echelon: requiredInteger(),
        level: requiredInteger(),
        treasure: requiredInteger(),
      }, { persisted: false }),
    });

    schema.combat = new fields.SchemaField({
      save: new fields.SchemaField({
        threshold: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, max: 10, initial: 6 }),
        bonus: new FormulaField(),
      }),
      size: new fields.EmbeddedDataField(this._sizeModel()),
      stability: requiredInteger(),
      turns: requiredInteger({ initial: 1 }),
      targetModifiers: new fields.SchemaField({
        edges: requiredInteger({ min: null }),
        banes: requiredInteger({ min: null }),
      }, { persisted: false }),
    });

    schema.biography = new fields.SchemaField({
      value: new fields.HTMLField(),
      director: new fields.HTMLField({ gmOnly: true }),
    });

    schema.movement = new fields.SchemaField({
      value: requiredInteger({ initial: 5 }),
      types: new fields.SetField(setOptions(), { initial: ["walk"] }),
      hover: new fields.BooleanField(),
      disengage: requiredInteger({ initial: 1 }),
      teleport: new fields.NumberField({ integer: true, min: 0, persisted: false }),
      multiplier: new fields.NumberField({ initial: 1, persisted: false }),
    });

    schema.damage = new fields.SchemaField({
      immunities: damageTypes(requiredInteger, { all: true }),
      weaknesses: damageTypes(requiredInteger, { all: true }),
    });

    schema.statuses = new fields.SchemaField({
      immunities: new fields.SetField(setOptions()),
      canFlank: new fields.BooleanField({ initial: true, persisted: false }),
      flankable: new fields.BooleanField({ initial: true, persisted: false }),
      // Fields for individual statuses *must* be SchemaFields
      slowed: new fields.SchemaField({
        speed: requiredInteger({ initial: () => CONFIG.statusEffects.slowed.defaultSpeed }),
      }, { persisted: false }),
    });

    for (const status of Object.values(CONFIG.statusEffects)) {
      if (status.targeted) {
        const existing = schema.statuses.getField(status.id);
        const sources = new fields.SetField(
          new fields.DocumentUUIDField({ type: "Actor" }),
          { persisted: false, max: status.maxSources },
        );
        if (existing instanceof fields.SchemaField) existing.extendFields({ sources });
        else schema.statuses.extendFields({
          [status.id]: new fields.SchemaField({ sources }, { persisted: false }),
        });
      }
    }

    schema.restrictions = new fields.SchemaField({
      type: new fields.SetField(setOptions()),
      dsid: new fields.SetField(setOptions()),
    }, { persisted: false });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Actor.base"];

  /* -------------------------------------------------- */

  /**
   * The data model used for the `combat.size` property.
   * @protected
   * @returns {SizeModel}
   */
  static _sizeModel() {
    return SizeModel;
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

    this.movement.teleport = this.movement.types.has("teleport") ? this.movement.value : null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Account for immunities first, in case any changes impact later calculations
    this.statuses.immunities.forEach(imm => this.parent.statuses.delete(imm));

    // Apply all stamina bonuses before calculating winded
    this.stamina.max += this.echelon * this.stamina.bonuses.echelon;
    this.stamina.max += this.level * this.stamina.bonuses.level;
    this.stamina.max += this.stamina.bonuses.treasure;

    // If our current stamina has not been set, match it to max:
    this.stamina.value ??= this.stamina.max;

    // Presents better if there's a 0 instead of blank
    this.combat.save.bonus ||= "0";

    this.movement.value = Math.floor(this.movement.value * this.movement.multiplier);

    // Add restrictions based on status effects
    for (const effect of Object.values(CONFIG.statusEffects)) {
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
          depth: newSize,
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
   * Calculate the applicable immunity and weakness based on the damage type and ignored immunities.
   * @param {object} [options] Options to modify the damage application.
   * @param {string} [options.type]   Valid damage type.
   * @param {Array<string>} [options.ignoredImmunities]  Which damage immunities to ignore.
   * @returns {{immunity?: number, weakness?: number }}
   */
  calculateImmunityAndWeakness(options = {}) {
    const immunityAndWeakness = {};

    // Determine highest weakness between all weakness and the damage's type weakness
    const allWeakness = this.damage.weaknesses.all;
    const specificWeakness = this.damage.weaknesses[options.type] ?? 0; // Null check in case the damage type is untyped
    const weaknessAmount = Math.max(allWeakness, specificWeakness);
    if (weaknessAmount > 0) immunityAndWeakness.weakness = weaknessAmount;

    options.ignoredImmunities ??= [];
    // Reduce the immunities list to non-ignored immunities
    const immunities = Object.entries(this.damage.immunities).reduce((acc, [type, amount]) => {
      if (!options.ignoredImmunities.includes("all") && !options.ignoredImmunities.includes(type)) acc[type] = amount;
      return acc;
    }, {});
    const immunityAmount = Math.max(immunities.all ?? 0, immunities[options.type] ?? 0); // Null check in case type is not in immunities
    if (immunityAmount > 0) immunityAndWeakness.immunity = immunityAmount;

    return immunityAndWeakness;
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
    if (this.isMinion) {
      const combatGroups = this.combatGroups;
      if (combatGroups.size === 1) {
        return this.combatGroup.system.takeDamage([this.parent], damage, options);
      }
      else if (combatGroups.size === 0) {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.MinionNoSquad", { localize: true });
      }
      else {
        ui.notifications.warn("DRAW_STEEL.CombatantGroup.Error.TooManySquad", { localize: true });
      }
    }

    const { immunity = 0, weakness = 0 } = this.calculateImmunityAndWeakness(options);

    damage = Math.max(0, damage + weakness - immunity);

    if (damage === 0) {
      ui.notifications.info("DRAW_STEEL.Actor.DamageNotification.ImmunityReducedToZero", { format: { name: this.parent.name } });
      return this.parent;
    }

    // If there's damage left after weakness/immunities, apply damage to temporary stamina then stamina value
    return this.parent.modifyTokenAttribute("stamina", -1 * damage, true, false);
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

  /* -------------------------------------------------- */

  /**
   * Constructs an object with the formatted immunities and weaknesses with a list of damage labels.
   * @returns {{immunities: string, weaknesses: string, labels: Record<string, string>}}
   */
  _getImmunitiesWeaknesses() {
    const labels = {
      all: _loc("DRAW_STEEL.Actor.base.FIELDS.damage.immunities.all.label"),
      ...Object.entries(ds.CONFIG.damageTypes).reduce((acc, [type, { label }]) => {
        acc[type] = label;
        return acc;
      }, {}),
    };

    const immunities = Object.entries(this.damage.immunities)
      .filter(([damageType, value]) => value > 0)
      .map(([damageType, value]) => `<span class="immunity">${labels[damageType]} ${value}</span>`);
    const weaknesses = Object.entries(this.damage.weaknesses)
      .filter(([damageType, value]) => value > 0)
      .map(([damageType, value]) => `<span class="weakness">${labels[damageType]} ${value}</span>`);

    const formatter = game.i18n.getListFormatter({ type: "unit" });
    return {
      immunities: formatter.format(immunities),
      weaknesses: formatter.format(weaknesses),
      labels,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Constructs an object with the actor's movement types as well as all options available from CONFIG.Token.movement.actions.
   * @param {boolean} [excludeWalk=false] Whether to include the Walk movement type.
   * @returns {{canHover: boolean, list: string, options: FormSelectOption[]}}
   */
  _getMovement(excludeWalk = false) {
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const actorMovement = this.movement;
    const canHover = actorMovement.types.has("fly") || actorMovement.types.has("teleport");
    const movementList = Array.from(actorMovement.types).map(m => {
      let label = _loc(CONFIG.Token.movement.actions[m]?.label ?? m);
      if ((m === "teleport") && (actorMovement.teleport !== actorMovement.value)) label += " " + actorMovement.teleport;
      return label;
    });

    if (canHover && actorMovement.hover) movementList.push(_loc("DRAW_STEEL.Actor.base.FIELDS.movement.hover.label"));

    if (excludeWalk) {
      const walkIndex = movementList.indexOf(_loc(CONFIG.Token.movement.actions.walk.label));
      movementList.splice(walkIndex, 1);
    }

    return {
      canHover,
      list: formatter.format(movementList),
      options: Object.entries(CONFIG.Token.movement.actions)
        .filter(([key, _action]) => ds.CONFIG.speedOptions.includes(key))
        .map(([value, { label }]) => ({ value, label })),
      show: !!this.movement.value,

    };
  }
}
