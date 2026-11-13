/**
 * A class for constructing and evaluating complex JSON filter statements against a data object.
 */
export default class Filter {
  /**
   * @param {object} statements   An object containing both logical and comparison filter statements.
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
    return this.#evaluate(data, this.statements);
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate a single filter statement.
   * @param {object} data        The data object to evaluate the filter against.
   * @param {object} statement   The filter statement to evaluate.
   * @returns {boolean}
   */
  #evaluate(data, statement) {
    // Step 1. Check if any logic operators are used.
    const logicOperator = Filter.logicOperators.find(operator => Object.hasOwn(statement, operator));
    if (logicOperator) return this[logicOperator](data, statement[logicOperator]);

    // Step 2. Check for comparison operator statements.
    const { operator, key, value: filterValue } = statement;
    if (!Filter.comparisonOperators.includes(operator)) {
      console.warn(`Invalid Filter Operator: ${operator}. The statement was evaluated as false.`);
      return false;
    }

    const dataValue = foundry.utils.getProperty(data, key);
    if (dataValue == null) return false;

    return this[operator](dataValue, filterValue);
  }

  /* -------------------------------------------------- */
  /*   Logical Operators                                */
  /* -------------------------------------------------- */

  /**
   * All possible logic operators to use for an array of statements.
   * @type {string[]}
   */
  static logicOperators = ["and", "or", "not"];

  /* -------------------------------------------------- */

  /**
   * Evaluate if all of the statements are true.
   * @param {object} data           The data object to evaluate the filter statement against.
   * @param {object[]} statements   An array of conditional statement objects.
   * @returns {boolean}
   */
  and(data, statements) {
    return statements.every(statement => this.#evaluate(data, statement));
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if any of the statements are true.
   * @param {object} data           The data object to evaluate the filter statement against.
   * @param {object[]} statements   An array of conditional statements.
   * @returns {boolean}
   */
  or(data, statements) {
    return statements.some(statement => this.#evaluate(data, statement));
  }

  /* -------------------------------------------------- */

  /**
   * Evaluates to the inverse of the provided statement.
   * @param {object} data        The data object to evaluate the filter statement against.
   * @param {object} statement   A conditional statement.
   * @returns {boolean}
   */
  not(data, statement) {
    return !this.#evaluate(data, statement);
  }

  /* -------------------------------------------------- */
  /*   Comparison Operators                                */
  /* -------------------------------------------------- */

  /**
   * All possible comparison operators for a statement.
   * @type {string[]}
   */
  static comparisonOperators = ["equals", "equalsAny", "gt", "gte", "lt", "lte", "has", "hasAll", "hasAny"];

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value equals the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  equals(dataValue, filterValue) {
    return dataValue === filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value equals any of the filter values.
   * @param {string | number} dataValue            The value at the statement's key in the data.
   * @param {Array<string | number>} filterValue   The filter values to match against the data value.
   * @returns {boolean}
   */
  equalsAny(dataValue, filterValue) {
    return filterValue.some(value => dataValue === value);
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is greater than the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  gt(dataValue, filterValue) {
    return dataValue > filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is greater than or equal to the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  gte(dataValue, filterValue) {
    return dataValue >= filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is less than the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  lt(dataValue, filterValue) {
    return dataValue < filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if the data value is less than or equal to the filter value.
   * @param {string | number} dataValue     The value at the statement's key in the data.
   * @param {string | number} filterValue   The filter value to match against the data value.
   * @returns {boolean}
   */
  lte(dataValue, filterValue) {
    return dataValue <= filterValue;
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if a data set, array, or object has the filter value.
   * @param {Set | Array | object} dataValue   The value at the statement's key in the data.
   * @param {string | number} filterValue      The value to match against the data value.
   * @param {string} [type]                    The data value's type. Prevents rechecking the type when used in hasAll and hasAny.
   * @returns {boolean}
   */
  has(dataValue, filterValue, type) {
    type ??= foundry.utils.getType(dataValue);
    switch (type) {
      case "Set":
        return dataValue.has(filterValue);
      case "Array":
        return dataValue.includes(filterValue);
      case "Object":
        return Object.hasOwn(dataValue, filterValue);
      default:
        return false;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if a data set, array, or object has all of the filter values.
   * @param {Set | Array | object} dataValue       The value at the statement's key in the data.
   * @param {Array<string | number>} filterValue   The values to match against the data value.
   * @returns {boolean}
   */
  hasAll(dataValue, filterValue) {
    const type = foundry.utils.getType(dataValue);
    return filterValue.every(value => this.has(dataValue, value, type));
  }

  /* -------------------------------------------------- */

  /**
   * Evaluate if a data set, array, or object has any of the filter values.
   * @param {Set | Array | object} dataValue       The value at the statement's key in the data.
   * @param {Array<string | number>} filterValue   The values to match against the data value.
   * @returns {boolean}
   */
  hasAny(dataValue, filterValue) {
    const type = foundry.utils.getType(dataValue);
    return filterValue.some(value => this.has(dataValue, value, type));
  }
}
