/**
 * @import { FilterComparisonStatement, FilterLogicStatement, FilterStatement } from "../_types.mjs";
 */

/**
 * A class for constructing and evaluating complex JSON filter statements against a data object.
 */
export default class Filter {
  /**
   * @param {FilterStatement} statements   An object containing both logical and comparison filter statements.
   */
  constructor(statements) {
    this.statements = statements;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate the filter's statements against the provided data.
   * @param {object} data   The data object to evaluate the filter against.
   * @returns {boolean}
   */
  evaluate(data) {
    return this.constructor.evaluateStatement(data, this.statements);
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate a single filter statement.
   * @param {object} data        The data object to evaluate the filter against.
   * @param {FilterStatement} statement   The filter statement to evaluate.
   * @returns {boolean}
   */
  static evaluateStatement(data, statement) {
    // Step 1. Check if any logic operators are used.
    if (statement.and) return this.and(data, statement.and);
    if (statement.or) return this.or(data, statement.or);
    if (statement.not) return this.not(data, statement.not);

    // Step 2. Check for comparison operator statements.
    const { operator, key, value: filterValue } = statement;
    const comparisonCallback = this.COMPARISON_OPERATORS[operator];
    if (!comparisonCallback) {
      console.warn(`Invalid Filter Operator: ${operator}. The statement was evaluated as false.`);
      return false;
    }

    const dataValue = foundry.utils.getProperty(data, key);

    return comparisonCallback(dataValue, filterValue);
  }

  /* -------------------------------------------------- */
  /*   Logical Operators                                */
  /* -------------------------------------------------- */

  /**
   * Evaluate if all of the statements are true.
   * @param {object} data                              The data object to evaluate the filter statement against.
   * @param {FilterStatement[]} statements   An array of conditional statement objects.
   * @returns {boolean}
   */
  static and(data, statements) {
    return statements.every(statement => this.evaluateStatement(data, statement));
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if any of the statements are true.
   * @param {object} data                              The data object to evaluate the filter statement against.
   * @param {FilterStatement[]} statements   An array of conditional statements.
   * @returns {boolean}
   */
  static or(data, statements) {
    return statements.some(statement => this.evaluateStatement(data, statement));
  }

  /* -------------------------------------------------- */

  /**
   * Evaluates to the inverse of the provided statement.
   * @param {object} data                           The data object to evaluate the filter statement against.
   * @param {FilterStatement} statement   A conditional statement.
   * @returns {boolean}
   */
  static not(data, statement) {
    return !this.evaluateStatement(data, statement);
  }

  /* -------------------------------------------------- */
  /*   Comparison Operators                             */
  /* -------------------------------------------------- */

  /**
   * A function that evaluates a comparison operator.
   * @callback ComparisonFunction
   * @param {string | number | Set | Array | object } dataValue   The value at the statement's key in the data.
   * @param {string | number} filterValue                         The statement's value, if the operator uses one.
   * @returns {boolean}
   */

  /**
   * Comparison operators, mapped to the functions that evaluate them.
   * @type {Readonly<Record<string, ComparisonFunction>>}
   */
  static COMPARISON_OPERATORS = Object.freeze({
    eq: this.eq,
    gt: this.gt,
    gte: this.gte,
    lt: this.lt,
    lte: this.lte,
    contains: this.contains,
    empty: this.empty,
  });

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value equals the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  static eq(dataValue, filterValue) {
    return dataValue === filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is greater than the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  static gt(dataValue, filterValue) {
    return dataValue > filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is greater than or equal to the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  static gte(dataValue, filterValue) {
    return dataValue >= filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is less than the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  static lt(dataValue, filterValue) {
    return dataValue < filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is less than or equal to the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  static lte(dataValue, filterValue) {
    return dataValue <= filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if a data set or array has the filter value.
   * @param {Set | Array} dataValue            The value at the statement's key in the data.
   * @param {string | number} filterValue      The value to match against the data value.
   * @returns {boolean}
   */
  static contains(dataValue, filterValue) {
    const type = foundry.utils.getType(dataValue);
    switch (type) {
      case "Set":
        return dataValue.has(filterValue);
      case "Array":
        return dataValue.includes(filterValue);
      default:
        return false;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Check whether a data value is empty.
   * @param {Set | Array | object} dataValue   The value at the statement's key in the data.
   * @returns {boolean}
   */
  static empty(dataValue) {
    return foundry.utils.isEmpty(dataValue);
  }
}
