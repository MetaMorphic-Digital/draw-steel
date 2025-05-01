import { systemPath } from "../constants.mjs";
import DrawSteelChatMessage from "../documents/chat-message.mjs";
import { DSRoll } from "./base.mjs";

/** @import { PowerRollPrompt, PowerRollPromptOptions } from "../_types.js" */

/**
 * Augments the Roll class with specific functionality for power rolls
 */
export class PowerRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false,
    });

    if (!PowerRoll.VALID_TYPES.has(this.options.type)) throw new Error("Power rolls must be an ability or test");
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);
    if (!options.appliedModifier) {

      // Add edges/banes to formula
      if (Math.abs(this.netBoon) === 1) {
        const operation = new foundry.dice.terms.OperatorTerm({ operator: (this.netBoon > 0 ? "+" : "-") });
        const number = new foundry.dice.terms.NumericTerm({
          number: 2,
          options: {
            flavor: game.i18n.localize(this.netBoon > 0 ? "DRAW_STEEL.Roll.Power.Modifier.Edge" : "DRAW_STEEL.Roll.Power.Modifier.Bane"),
          },
        });
        this.terms.push(operation, number);
      }

      // add bonuses to formula
      if (this.options.bonuses) {
        const operation = new foundry.dice.terms.OperatorTerm({ operator: (this.options.bonuses > 0 ? "+" : "-") });
        const number = new foundry.dice.terms.NumericTerm({
          number: Math.abs(this.options.bonuses),
          options: {
            flavor: game.i18n.localize(this.options.bonuses > 0 ? "DRAW_STEEL.Roll.Power.Modifier.Bonus" : "DRAW_STEEL.Roll.Power.Modifier.Penalty"),
          },
        });
        this.terms.push(operation, number);
      }

      this.resetFormula();
      this.options.appliedModifier = true;
    }
  }

  static DEFAULT_OPTIONS = Object.freeze({
    type: "test",
    criticalThreshold: 19,
    banes: 0,
    edges: 0,
    bonuses: 0,
  });

  static CHAT_TEMPLATE = systemPath("templates/rolls/power.hbs");

  /**
   * Types of Power Rolls
   * @returns A key-value pair of the valid types and their i18n strings
   */
  static get TYPES() {
    return PowerRoll.#TYPES;
  }

  /** @enum {{label: string; icon: string}} */
  static #TYPES = Object.freeze({
    ability: {
      label: "DRAW_STEEL.Roll.Power.Types.Ability",
      icon: "fa-solid fa-bolt",
    },
    test: {
      label: "DRAW_STEEL.Roll.Power.Types.Test",
      icon: "fa-solid fa-dice",
    },
  });

  /**
   * Set of power roll types
   * @type {Set<"ability" | "test">}
   */
  static get VALID_TYPES() {
    return new Set(Object.keys(this.#TYPES));
  }

  /**
   * Maximum number of edges
   */
  static MAX_EDGE = 2;

  /**
   * Maximum number of banes
   */
  static MAX_BANE = 2;

  /**
   * Power roll result tiers
   */
  static get RESULT_TIERS() {
    return this.#RESULT_TIERS;
  }

  /**
   * Names of the result tiers
   * @type {Array<"tier1" | "tier2" | "tier3">}
   */
  static get TIER_NAMES() {
    return Object.keys(this.#RESULT_TIERS);
  }

  /** @enum {{label: string; threshold: number}} */
  static #RESULT_TIERS = {
    tier1: {
      label: "DRAW_STEEL.Roll.Power.Tiers.One",
      threshold: -Infinity,
    },
    tier2: {
      label: "DRAW_STEEL.Roll.Power.Tiers.Two",
      threshold: 12,
    },
    tier3: {
      label: "DRAW_STEEL.Roll.Power.Tiers.Three",
      threshold: 17,
    },
  };

  /**
   * Prompt the user with a roll configuration dialog
   * @param {Partial<PowerRollPromptOptions>} [options] Options for the dialog
   * @return {Promise<PowerRollPrompt>} Based on evaluation made can either return an array of power rolls or chat messages
   */
  static async prompt(options = {}) {
    const type = options.type ?? "test";
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    options.modifiers ??= {};
    options.modifiers.edges ??= 0;
    options.modifiers.banes ??= 0;
    options.modifiers.bonuses ??= 0;
    options.actor ??= DrawSteelChatMessage.getSpeakerActor(DrawSteelChatMessage.getSpeaker());
    if (!this.VALID_TYPES.has(type)) throw new Error("The `type` parameter must be 'ability' or 'test'");
    if (!["none", "evaluate", "message"].includes(evaluation)) throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    const typeLabel = game.i18n.localize(this.TYPES[type].label);
    let flavor = options.flavor ?? typeLabel;

    this.getActorModifiers(options);
    const context = {
      modifiers: options.modifiers,
      targets: options.targets,
      type,
    };

    if (options.ability) context.ability = options.ability;
    if (options.skills) context.skills = options.skills;

    const promptValue = await ds.applications.apps.PowerRollDialog.prompt({
      context,
      window: {
        title: game.i18n.format("DRAW_STEEL.Roll.Power.Prompt.Title", { typeLabel }),
      },
    });

    if (!promptValue) return null;

    const baseRoll = new this(formula, options.data, { baseRoll: true, damageSelection: promptValue.damage, skill: promptValue.skill });
    await baseRoll.evaluate();

    const speaker = DrawSteelChatMessage.getSpeaker({ actor: options.actor });
    const rolls = [baseRoll];
    // DSN support - ensure that only the base power roll is displayed on screen
    const termData = baseRoll.terms[0].toJSON();
    // Ensures `termData.options` is a copy instead of reference
    termData.options = { ...termData.options, rollOrder: 999 };
    const firstTerm = foundry.dice.terms.RollTerm.fromData(termData);
    for (const context of promptValue.rolls) {
      if (options.ability) context.ability = options.ability;
      if (promptValue.skill) flavor = `${flavor} - ${ds.CONFIG.skills.list[promptValue.skill]?.label ?? promptValue.skill}`;
      const roll = new this(formula, options.data, { flavor, ...context });
      roll.terms[0] = firstTerm;
      switch (evaluation) {
        case "none":
          rolls.push(roll);
          break;
        case "evaluate":
          rolls.push(await roll.evaluate());
          break;
        case "message":
          rolls.push(await roll.toMessage({ speaker }, { rollMode: promptValue.rollMode }));
          break;
      }
    }
    return { rollMode: promptValue.rollMode, powerRolls: rolls };
  }

  /**
   * Determines if this is a power roll with 2d10 base
   * @returns {boolean}
   */
  get isValidPowerRoll() {
    const firstTerm = this.terms[0];
    return (firstTerm instanceof foundry.dice.terms.Die) && (firstTerm.faces === 10) && (firstTerm.number === 2);
  }

  /**
   * Cancels out edges and banes to get the adjustment
   * @returns {number} An integer from -2 to 2, inclusive
   */
  get netBoon() {
    return this.options.edges - this.options.banes;
  }

  /**
   * Produces the tier of a roll as a number
   * @returns {1 | 2 | 3 | undefined} Returns a number for the tier or undefined if this isn't yet evaluated
   */
  get product() {
    if (this._total === undefined) return undefined;
    // Crits are always a tier 3 result
    if (this.isCritical) return 3;

    const tier = Object.values(this.constructor.RESULT_TIERS).reduce((t, { threshold }) => t + Number(this.total >= threshold), 0);
    // Adjusts tiers for double edge/bane
    const adjustment = this.netBoon - Math.sign(this.netBoon);
    return Math.clamp(tier + adjustment, 1, 3);
  }

  /**
   * Converts the tier of a roll into a string property
   * @returns {string | undefined} Returns a string for the tier or undefined if this isn't yet evaluated
   */
  get tier() {
    if (this.product === undefined) return undefined;
    return `tier${this.product}`;
  }

  /**
   * Returns the natural result of the power roll
   * @returns {number | undefined}
   */
  get naturalResult() {
    return this.dice[0].total;
  }

  /**
   * Determines if the natural result was a natural 20
   * @returns {boolean | null} Null if not yet evaluated
   */
  get isNat20() {
    if ((this._total === undefined) || !this.isValidPowerRoll) return null;
    return (this.dice[0].total >= 20);
  }

  /**
   * Determines if a power roll was a critical
   * @returns {boolean | null} Null if not yet evaluated,
   * otherwise returns if the dice total is a 19 or higher
   */
  get isCritical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }

  /**
   * Return a version of the formula that doesn't have the flavor text.
   * @returns {string}
   */
  get flavorlessFormula() {
    const flavorlessRoll = new this.constructor(this.formula);
    for (const term of flavorlessRoll.terms) term.options.flavor = "";
    return flavorlessRoll.formula;
  }

  async _prepareContext({ flavor, isPrivate }) {
    const context = await super._prepareContext({ flavor, isPrivate });

    context.tier = {
      label: game.i18n.localize(this.constructor.RESULT_TIERS[this.tier].label),
      class: this.tier,
    };

    let modString = "";

    switch (this.netBoon) {
      case -2:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Banes";
        break;
      case -1:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Bane";
        break;
      case 1:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Edge";
        break;
      case 2:
        modString = "DRAW_STEEL.Roll.Power.Modifier.Edges";
        break;
    }

    context.modifier = {
      number: Math.abs(this.netBoon),
      mod: game.i18n.localize(modString),
    };

    if (this.options.target) context.target = await fromUuid(this.options.target);

    context.baseRoll = this.options.baseRoll ?? false;
    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";
    context.flavorlessFormula = this.flavorlessFormula;

    return context;
  }

  /**
   * Modify the options object based on conditions that apply to all Power Rolls
   * @param {Partial<PowerRollPromptOptions>} [options] Options for the dialog
   */
  static getActorModifiers(options) {
    if (!options.actor) return;

    if (options.actor.statuses.has("weakened")) options.modifiers.banes += 1;

    // Restrained condition - might and agility tests take a bane
    if (options.actor.statuses.has("restrained") && (options.type === "test") && ["might", "agility"].includes(options.characteristic)) options.modifiers.banes += 1;
  }
}
