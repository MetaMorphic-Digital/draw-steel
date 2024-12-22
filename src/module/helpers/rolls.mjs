import {systemPath} from "../constants.mjs";

/**
 * Base roll class for Draw Steel
 */
export class DSRoll extends foundry.dice.Roll {
  /** @override */
  async render({flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false} = {}) {
    if (!this._evaluated) await this.evaluate({allowInteractive: !isPrivate});
    const chatData = await this._prepareContext({flavor, isPrivate});
    return renderTemplate(template, chatData);
  }

  /**
   * Helper function to generate render context in use with `static CHAT_TEMPLATE`
   * @param {object} options
   * @param {string} [options.flavor]     Flavor text to include
   * @param {boolean} [options.isPrivate] Is the Roll displayed privately?
   * @returns An object to be used in `renderTemplate`
   */
  async _prepareContext({flavor, isPrivate}) {
    return {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor ?? this.options.flavor,
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100
    };
  }

}

/**
 * Augments the Roll class with specific functionality for power rolls
 */
export class PowerRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false
    });
    if (!PowerRoll.VALID_TYPES.has(this.options.type)) throw new Error("Power rolls must be an ability or test");
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);
    if (!options.appliedModifier && (Math.abs(this.netBoon) === 1)) {
      const operation = new foundry.dice.terms.OperatorTerm({operator: (this.netBoon > 0 ? "+" : "-")});
      const number = new foundry.dice.terms.NumericTerm({
        number: 2,
        flavor: game.i18n.localize(this.netBoon > 0 ? "DRAW_STEEL.Roll.Power.Modifier.Edge" : "DRAW_STEEL.Roll.Power.Modifier.Bane")
      });
      this.terms.push(operation, number);
      this.resetFormula();
      this.options.appliedModifier = true;
    }
  }

  static DEFAULT_OPTIONS = Object.freeze({
    type: "test",
    criticalThreshold: 19,
    banes: 0,
    edges: 0
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
      icon: "fa-solid fa-bolt"
    },
    test: {
      label: "DRAW_STEEL.Roll.Power.Types.Test",
      icon: "fa-solid fa-dice"
    }
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
      threshold: -Infinity
    },
    tier2: {
      label: "DRAW_STEEL.Roll.Power.Tiers.Two",
      threshold: 12
    },
    tier3: {
      label: "DRAW_STEEL.Roll.Power.Tiers.Three",
      threshold: 17
    }
  };

  /**
   * Prompt the user with a roll configuration dialog
   * @param {object} [options] Options for the dialog
   * @param {"ability"|"test"} [options.type="test"]  A valid roll type
   * @param {"none"|"evaluate"|"message"} [options.evaluation="message"] How will the roll be evaluated and returned?
   * @param {number} [options.edges]                  Base edges for the roll
   * @param {number} [options.banes]                  Base banes for the roll
   * @param {string} [options.formula="2d10"]         Roll formula
   * @param {Record<string, unknown>} [options.data]  Roll data to be parsed by the formula
   * @param {string[]} [options.skills]               An array of skills that might be chosen
   */
  static async prompt(options = {}) {
    const type = options.type ?? "test";
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    if (!this.VALID_TYPES.has(type)) throw new Error("The `type` parameter must be 'ability' or 'test'");
    if (!["none", "evaluate", "message"].includes(evaluation)) throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    const typeLabel = game.i18n.localize(this.TYPES[type].label);
    const flavor = options.flavor ?? typeLabel;

    const dialogContext = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      bane: options.banes ?? 0,
      edges: options.edges ?? 0
    };

    if (options.skills) {
      dialogContext.skills = options.skills.reduce((obj, skill) => {
        const label = ds.CONFIG.skills.list[skill]?.label;
        if (!label) {
          console.warn("Could not find skill" + skill);
          return obj;
        }
        obj[skill] = label;
        return obj;
      }, {});
    }

    const content = await renderTemplate(systemPath("templates/rolls/prompt.hbs"), dialogContext);

    const rollContext = await foundry.applications.api.DialogV2.prompt({
      window: {title: game.i18n.format("DRAW_STEEL.Roll.Power.Prompt.Title", {typeLabel})},
      content,
      ok: {
        callback: (event, button, dialog) => {
          const output = Array.from(button.form.elements).reduce((obj, input) => {
            if (input.name) obj[input.name] = input.value;
            return obj;
          }, {});

          return output;
        }
      }
    });

    const roll = new this(formula, options.data, {flavor, ...rollContext});

    switch (evaluation) {
      case "none":
        return roll;
      case "evaluate":
        return roll.evaluate();
      case "message":
        return roll.toMessage();
    }
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

    const tier = Object.values(this.constructor.RESULT_TIERS).reduce((t, {threshold}) => t + Number(this.total >= threshold), 0);
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

  async _prepareContext({flavor, isPrivate}) {
    const context = await super._prepareContext({flavor, isPrivate});

    context.tier = {
      label: game.i18n.localize(this.constructor.RESULT_TIERS[this.tier].label),
      class: this.tier
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
      mod: game.i18n.localize(modString)
    };

    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";

    return context;
  }
}

/**
 * Special test
 */
export class ProjectRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    super(formula, data, options);
    foundry.utils.mergeObject(this.options, this.constructor.DEFAULT_OPTIONS, {
      insertKeys: true,
      insertValues: true,
      overwrite: false
    });
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);
    if (!options.appliedModifier && this.netBoon) {
      const operation = new foundry.dice.terms.OperatorTerm({operator: (this.netBoon > 0 ? "+" : "-")});
      const number = new foundry.dice.terms.NumericTerm({
        number: Math.min(4, 2 * Math.abs(this.netBoon)),
        flavor: game.i18n.localize(`DRAW_STEEL.Roll.Power.Modifier.${this.netBoon > 0 ? "Edge" : "Bane"}`)
      });
      this.terms.push(operation, number);
      this.resetFormula();
      this.options.appliedModifier = true;
    }
  }

  static DEFAULT_OPTIONS = Object.freeze({
    criticalThreshold: 19,
    banes: 0,
    edges: 0
  });

  static CHAT_TEMPLATE = systemPath("templates/rolls/project.hbs");

  /**
   * Maximum number of edges
   */
  static MAX_EDGE = 2;

  /**
   * Maximum number of banes
   */
  static MAX_BANE = 2;

  /**
   * Prompt the user with a roll configuration dialog
   * @param {object} [options] Options for the dialog
   * @param {"none"|"evaluate"|"message"} [options.evaluation="message"] How will the roll be evaluated and returned?
   * @param {number} [options.edges]                  Base edges for the roll
   * @param {number} [options.banes]                  Base banes for the roll
   * @param {string} [options.formula="2d10"]         Roll formula
   * @param {Record<string, unknown>} [options.data]  Roll data to be parsed by the formula
   * @param {string[]} [options.skills]               An array of skills that might be chosen
   */
  static async prompt(options = {}) {
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    if (!["none", "evaluate", "message"].includes(evaluation)) {
      throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    }
    const flavor = options.flavor ?? game.i18n.localize("DRAW_STEEL.Roll.Project.Label");

    const dialogContext = {
      modChoices: Array.fromRange(3).reduce((obj, number) => {
        obj[number] = number;
        return obj;
      }, {}),
      bane: options.banes ?? 0,
      edges: options.edges ?? 0
    };

    if (options.skills) {
      dialogContext.skills = options.skills.reduce((obj, skill) => {
        const label = ds.CONFIG.skills.list[skill]?.label;
        if (!label) {
          console.warn("Could not find skill" + skill);
          return obj;
        }
        obj[skill] = label;
        return obj;
      }, {});
    }

    const content = await renderTemplate(systemPath("templates/rolls/prompt.hbs"), dialogContext);

    const rollContext = await foundry.applications.api.DialogV2.prompt({
      window: {title: "DRAW_STEEL.Roll.Project.Label"},
      content,
      ok: {
        callback: (event, button, dialog) => {
          const output = Array.from(button.form.elements).reduce((obj, input) => {
            if (input.name) obj[input.name] = input.value;
            return obj;
          }, {});

          return output;
        }
      }
    });

    const roll = new this(formula, options.data, {flavor, ...rollContext});

    switch (evaluation) {
      case "none":
        return roll;
      case "evaluate":
        return roll.evaluate();
      case "message":
        return roll.toMessage();
    }
  }

  /**
   * Determines if this is a power roll with 2d10 base
   * @returns {boolean}
   */
  get isValidProjectRoll() {
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
   * Total project progress accrued from this roll
   * @returns {number | undefined}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return Math.max(1, this.total);
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
    if ((this._total === undefined) || !this.isValidProjectRoll) return null;
    return (this.dice[0].total >= 20);
  }

  /**
   * Determines if a project roll was a critical
   * @returns {boolean | null} Null if not yet evaluated,
   * otherwise returns if the dice total is a 19 or higher
   */
  get isCritical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }

  /**
   * Semantic alias for this.critical
   */
  get isBreakthrough() {
    return this.isCritical;
  }

  async _prepareContext({flavor, isPrivate}) {
    const context = await super._prepareContext({flavor, isPrivate});

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
      mod: game.i18n.localize(modString)
    };

    context.critical = (this.isCritical || this.isNat20) ? "critical" : "";

    return context;
  }
}

export class SavingThrowRoll extends DSRoll {
  /**
   * @param {string} [formula="1d10"]        Default saving throw is a flat 1d10
   * @param {Record<string, any>} [data]     Roll data
   * @param {{ flavor?: string }} [options]  Options to modify roll display
   */
  constructor(formula = "1d10", data = {}, options = {}) {
    super(formula, data, options);
  }

  static CHAT_TEMPLATE = systemPath("templates/rolls/save.hbs");

  /**
   * Did the saving throw succeed
   * @returns {boolean}
   */
  get product() {
    if (this._total === undefined) return undefined;
    return this.total >= 6;
  }

  /**
   * Helper function to generate render context in use with `static CHAT_TEMPLATE`
   * @param {object} options
   * @param {string} [options.flavor]     Flavor text to include
   * @param {boolean} [options.isPrivate] Is the Roll displayed privately?
   * @returns An object to be used in `renderTemplate`
   */
  async _prepareContext({flavor, isPrivate}) {
    return {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor ?? this.options.flavor ?? game.i18n.localize("DRAW_STEEL.Roll.Save.Label"),
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      result: this.product ? "critical" : "failure"
    };
  }
}
