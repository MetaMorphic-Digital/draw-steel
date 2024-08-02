/**
 * Base roll class for Draw Steel
 */
export class DSRoll extends foundry.dice.Roll {}

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
    if (!PowerRoll.VALID_TYPES.has(this.options.type)) throw new Error("Power rolls must be an ability, resistance, or test");
    this.options.edges = Math.clamp(this.options.edges, 0, this.constructor.MAX_EDGE);
    this.options.banes = Math.clamp(this.options.banes, 0, this.constructor.MAX_BANE);
  }

  static DEFAULT_OPTIONS = Object.freeze({
    type: "test",
    criticalThreshold: 19,
    banes: 0,
    edges: 0
  });

  /**
   * Types of Power Rolls
   * @returns A key-value pair of the valid types and their i18n strings
   */
  static get TYPES() {
    return PowerRoll.#TYPES;
  }

  static #TYPES = Object.freeze({
    ability: "DRAW_STEEL.Roll.Power.Types.Ability",
    resistance: "DRAW_STEEL.Roll.Power.Types.Resistance",
    test: "DRAW_STEEL.Roll.Power.Types.Test"
  });

  /**
   * Set of power roll types
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
   * Result tiers and their ranges
   */
  static RESULT_TIERS = [-Infinity, 12, 17, Infinity];

  /**
   * Prompt the user with a roll configuration dialog
   * @param {object} [options] - Options for the dialog
   * @param {"ability"|"resistance"|"test"} [options.type="test"]   - A valid roll type
   * @param {"none"|"evaluate"|"message"} [options.evaluation="evaluate"] - How will the roll be evaluated and returned?
   * @param {number} [options.edges] - Base edges for the roll
   * @param {number} [options.banes] - Base banes for the roll
   * @param {Record<string, unknown>} [options.data] - Roll data to be parsed by the formula
   */
  static async prompt(options = {}) {
    const type = options.type ?? "test";
    const evaluation = options.evaluation ?? "message";
    const formula = options.formula ?? "2d10";
    if (!this.VALID_TYPES.has(type)) throw new Error("The `type` parameter must be 'ability', 'resistance', or 'test'");
    if (!["none", "evaluate", "message"].includes(evaluation)) throw new Error("The `evaluation` parameter must be 'none', 'evaluate', or 'message'");
    const flavor = options.flavor ?? game.i18n.localize(this.TYPES[type]);

    const roll = new this(formula, options.data, {
      flavor,
      edges: options.edges,
      banes: options.banes
    });

    if (evaluation === "none") return roll;

    if (evaluation === "evaluate") return roll.evaluate();

    if (evaluation === "message") return roll.toMessage();
  }

  /**
   * Determines if this is a power roll with 2d10 base
   */
  get validPowerRoll() {
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
   * Produces the tier of a roll
   * @returns {number | undefined} Returns a number for the tier or undefined if this isn't yet evaluated
   */
  get product() {
    if (this._total === undefined) return undefined;
    const tier = this.constructor.RESULT_TIERS.reduce((t, threshold) => t + Number(this.total > threshold), 0);
    // Adjusts tiers for double edge/bane
    const adjustment = this.netBoon - Math.sign(this.netBoon);
    return Math.clamp(tier + adjustment, 1, 3);
  }

  /**
   * Semantic getter for {@link product}
   */
  get tier() {
    return this.product;
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
  get nat20() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= 20);
  }

  /**
   * Determines if an ability power roll was a critical
   * @returns {boolean | null} Null if not yet evaluated or not an ability roll,
   * otherwise returns true if the dice total is a 19 or higher
   */
  get critical() {
    if (this.options.type !== "ability") return null;
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }
}
