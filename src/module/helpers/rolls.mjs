/**
 * Base roll class for Draw Steel
 */
export class DSRoll extends Roll {}

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
   */
  static get TYPES() {
    return PowerRoll.#TYPES;
  }

  static #TYPES = Object.freeze({
    ABILITY: "ability",
    RESISTANCE: "resistance",
    TEST: "test"
  });

  /**
   * Set of power roll types
   */
  static get VALID_TYPES() {
    return new Set(Object.values(this.#TYPES));
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

  get validPowerRoll() {
    return (this.terms[0] instanceof foundry.dice.terms.Die) && (this.terms[0].faces === 10) && (this.terms[0].number === 2);
  }

  /**
   * Cancels out edges and banes to get the adjustment
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
    const adjustment = parseInt(this.netBoon / 2);
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
