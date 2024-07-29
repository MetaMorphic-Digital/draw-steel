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
    if (this.options.criticalThreshold === undefined) this.options.criticalThreshold = 19;
  }

  /**
   * Produces the tier of a roll
   * @returns {number | undefined} Returns a number for the tier or undefined if this isn't yet evaluated
   */
  get product() {
    if (this._total === undefined) return undefined;
    else if (this._total < 11) return 1;
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
   * Determines if this power roll was a critical
   * @returns {boolean | null} Null if not yet evaluated, otherwise returns true if the dice total is a 19 or higher
   */
  get critical() {
    if (this._total === undefined) return null;
    return (this.dice[0].total >= this.options.criticalThreshold);
  }
}
