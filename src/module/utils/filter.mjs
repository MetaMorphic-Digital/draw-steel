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

    const validation = this.validate();
    this.valid = validation.valid;
    this.validationReasons = validation.failureReasons;

    if (!this.valid) console.log(this.validationReasons);
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
    else if (statement.or) return this.or(data, statement.or);
    else if (statement.not) return this.not(data, statement.not);

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
   * @param {object} data                 The data object to evaluate the filter statement against.
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

  /* -------------------------------------------------- */
  /*   Validation                                       */
  /* -------------------------------------------------- */

  /**
   * Validate a filter's statement(s).
   * @returns {{valid: boolean, failureReasons: string[]}}
   */
  validate() {
    const failureReasons = [];

    this.constructor.validateStatement(this.statements, failureReasons, "root");

    return { valid: !failureReasons.length, failureReasons };
  }

  /* -------------------------------------------------- */

  /**
   * Validate a provided logic or comparison statement.
   * @param {FilterStatement} statement   A conditional statement.
   * @param {string[]} failureReasons     An array of localized validation failure messages.
   * @param {string} path                 The object path that's currently being validated.
   */
  static validateStatement(statement, failureReasons, path) {
    // Return early if statement is not an object.
    if (foundry.utils.getType(statement) !== "Object") return void failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.NotAnObject", { path }));

    // Return early if the object has no keys.
    if (foundry.utils.isEmpty(statement)) return void failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.NoEmptyStatement", { path }));

    const statementKeys = new Set(Object.keys(statement));
    const validLogicOperators = new Set(["and", "or", "not"]);

    if (statementKeys.intersection(validLogicOperators).size) this.validateLogicStatement(statement, failureReasons, path);
    else this.validateComparisonStatement(statement, failureReasons, path);
  }

  /* -------------------------------------------------- */

  /**
   * Validate a logic statement.
   * @param {FilterLogicStatement} statement   A conditional statement.
   * @param {string[]} failureReasons          An array of localized validation failure messages.
   * @param {string} path                      The object path that's currently being validated.
   */
  static validateLogicStatement(statement, failureReasons, path) {
    const validLogicOperators = new Set(["and", "or", "not"]);
    const statementKeys = new Set(Object.keys(statement));

    // 1. Validate that there is only one top level operator
    if (statementKeys.size > 1) failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Logic.OneOperator", { path }));

    // 2. Validate that only acceptable logic keys are present.
    const invalidKeys = statementKeys.difference(validLogicOperators);
    if (invalidKeys.size) {
      const invalid = game.i18n.getListFormatter().format([...invalidKeys]);
      failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Logic.InvalidOperator", { path, invalid }));
    }

    // 3. Validate logic operators are passed the proper type.
    const validateArrayOperator = (operator) => {
      const value = statement[operator];
      const operatorPath = `${path}.${operator}`;

      if (!Array.isArray(value)) {
        failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Logic.ArrayRequired", { path: operatorPath, operator }));
        return;
      }

      if (!value.length) failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Logic.NoEmptyArray", { path: operatorPath, operator }));
      for (const [index, stmnt] of value.entries()) this.validateStatement(stmnt, failureReasons, `${operatorPath}.${index}`);
    };

    if ("and" in statement) validateArrayOperator("and");
    if ("or" in statement) validateArrayOperator("or");
    if ("not" in statement) this.validateStatement(statement.not, failureReasons, `${path}.not`);
  }

  /* -------------------------------------------------- */

  /**
   * Validate a comparison statement.
   * @param {FilterComparisonStatement} statement   A conditional statement.
   * @param {string[]} failureReasons               An array of localized validation failure messages.
   * @param {string} path                           The object path that's currently being validated.
   */
  static validateComparisonStatement(statement, failureReasons, path) {
    const statementKeys = new Set(Object.keys(statement));
    const validComparisonKeys = new Set(["key", "value", "operator"]);
    const valuelessOperators = new Set(["empty"]);

    // 1. Validate comparison keys
    const invalidKeys = statementKeys.difference(validComparisonKeys);
    if (invalidKeys.size) {
      const invalid = game.i18n.getListFormatter().format([...invalidKeys]);
      failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Comparison.InvalidKeys", { path, invalid }));
    }

    // 2. Validate that statement.operator is a valid comparison operator
    const validComparisonOperators = new Set(Object.keys(this.COMPARISON_OPERATORS));
    if (("operator" in statement) && !validComparisonOperators.has(statement.operator)) {
      failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Comparison.InvalidOperator", { path, operator: statement.operator }));
    }

    // 3. Validate all required keys are present.
    const requiredKeys = new Set(validComparisonKeys);
    // The empty comparison doesn't require value.
    if (valuelessOperators.has(statement.operator)) requiredKeys.delete("value");
    const missingKeys = requiredKeys.difference(statementKeys);
    if (missingKeys.size) {
      const missing = game.i18n.getListFormatter().format([...missingKeys]);
      failureReasons.push(_loc("DRAW_STEEL.Filter.Validation.Comparison.MissingKeys", { path, missing }));
    }
  }
}
