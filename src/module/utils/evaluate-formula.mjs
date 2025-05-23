import { DSRoll } from "../rolls/base.mjs";

/**
 * Helper function to perform synchronous evaluation of a user-input formula
 * User-input formulas may throw if blank or otherwise contain invalid terms
 * @param {string} formula                      The roll formula. May be blank or otherwise invalid
 * @param {object} [rollData]                   The roll data for parsing
 * @param {object} [options]                    Options for this method to forward
 * @param {boolean} [options.strict=false]      Forwarded to {@linkcode DSRoll.evaluateSync}
 * @param {boolean} [options.allowStrings=true] Forwarded to {@linkcode DSRoll.evaluateSync}
 * @param {string} [options.contextName]        Helpful string put into the error message
 * @returns {number} Returns the total, or 0 if it failed to evaluate
 */
export default function evaluateFormula(formula, rollData = {}, { strict = false, allowStrings = true, contextName = "unknown" } = {}) {
  let result = 0;
  try {
    const evaluatedResult = new DSRoll(formula, rollData).evaluateSync({ strict, allowStrings }).total;
    result = evaluatedResult;
  }
  catch (e) {
    console.error(`Failed to evaluate formula ${formula} in ${contextName}`, e);
  }
  return result;
}
