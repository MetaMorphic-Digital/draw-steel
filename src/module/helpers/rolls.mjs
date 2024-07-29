/**
 * Base roll class for Draw Steel
 */
export class DSRoll extends Roll {}

/**
 * Augments the Roll class with specific functionality for power rolls
 */
export class PowerRoll extends DSRoll {
  constructor(formula = "2d10", data = {}, options = {}) {
    // TODO: Figure out how hard to code the formula
    super(formula, data, options);
    if (this.options.type === undefined) this.options.type = "test";
    else if (!PowerRoll.VALID_TYPES.has(this.options.type)) throw new Error("Power rolls must be an ability, resistance, or test");
    if (this.options.criticalThreshold === undefined) this.options.criticalThreshold = 19;
  }

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
   * Produces the tier of a roll
   * @returns {number | undefined} Returns a number for the tier or undefined if this isn't yet evaluated
   */
  get product() {
    if (this._total === undefined) return undefined;
    else if (this._total < 11) return 1; // TODO: Possibly adjust these thresholds to be configurable
    else if (this._total < 17) return 2;
    else return 3;
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
