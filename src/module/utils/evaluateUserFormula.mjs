import { DSRoll } from "../rolls/base.mjs";

/**
 * Helper function to perform synchronous evaluation of a user-input formula
 * User-input formulas may throw if blank or otherwise contain invalid terms
 * @param {string} formula                    The roll formula. May be blank or otherwise invalid
 * @param {object} [rollData]                 The roll data for parsing
 * @param {object} [options]                  Options for this method to forward
 * @param {boolean} [options.strict]          Forwarded to {@linkcode DSRoll.evaluateSync}
 * @param {boolean} [options.allowStrings]    Forwarded to {@linkcode DSRoll.evaluateSync}
 * @param {string} [options.contextName]      Helpful string put into the error message
 * @returns {string | number} Returns the original formula if it failed to evaluate, or the total if it succeeded
 */
export default function evaluateUserFormula(formula, rollData = {}, { strict, allowStrings, contextName = "unknown" } = {}) {
  let result = formula;
  try {
    const evaluatedResult = new DSRoll(formula, rollData).evaluateSync({ strict, allowStrings }).total;
    result = evaluatedResult;
  }
  catch (e) {
    console.error(`Failed to evaluate formula ${formula} in ${contextName}`, e);
  }
  return result;
}
