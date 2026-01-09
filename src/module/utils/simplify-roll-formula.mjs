// Adapted from dnd5e

import DSRoll from "../rolls/base.mjs";

const {
  Coin, DiceTerm, Die, FunctionTerm, NumericTerm, OperatorTerm, ParentheticalTerm, RollTerm,
} = foundry.dice.terms;

/**
 * A standardized helper function for simplifying the constant parts of a multipart roll formula.
 *
 * @param {string} formula                  The original roll formula.
 * @param {object} [rollData={}]            The actor or item roll data to use for the formula.
 *
 * @returns {string}  The resulting simplified formula.
 */
export default function simplifyRollFormula(formula, rollData = {}) {

  // Verify that the formula is valid before attempting to simplify it.
  if (!DSRoll.validate(formula)) {
    console.warn(`Unable to simplify formula '${formula}': The roll formula is not valid.`);
    return formula;
  }

  const roll = new DSRoll(formula.replace(RollTerm.FLAVOR_REGEXP, ""), rollData);

  // If roll is deterministic, return early with evaluated total.
  if (roll.isDeterministic) return String(roll.evaluateSync().total);

  // If the formula contains multiplication or division we cannot easily simplify
  if (/[*/]/.test(roll.formula)) return roll.constructor.getFormula(roll.terms);

  // Flatten the roll formula and eliminate string terms.
  roll.terms = _expandParentheticalTerms(roll.terms);
  roll.terms = DSRoll.simplifyTerms(roll.terms);

  // Group terms by type and perform simplifications on various types of roll term.
  let { poolTerms, diceTerms, mathTerms, numericTerms } = _groupTermsByType(roll.terms);
  numericTerms = _simplifyNumericTerms(numericTerms ?? []);
  diceTerms = _simplifyDiceTerms(diceTerms ?? []);

  // Recombine the terms into a single term array and remove an initial + operator if present.
  const simplifiedTerms = [numericTerms, diceTerms, poolTerms, mathTerms].flat().filter(_ => _);
  if (simplifiedTerms[0]?.operator === "+") simplifiedTerms.shift();
  return roll.constructor.getFormula(simplifiedTerms);
}

/* -------------------------------------------------- */

/**
 * A helper function for combining unannotated numeric terms in an array into a single numeric term.
 * @param {object[]} terms  An array of roll terms.
 * @returns {Array<NumericTerm|OperatorTerm>}      A new array of terms with numeric terms combined into one.
 */
function _simplifyNumericTerms(terms) {
  if (!terms.length) return terms;

  const staticBonus = DSRoll.safeEval(DSRoll.getFormula(terms));
  if (staticBonus === 0) return [];

  // If the staticBonus is greater than 0, add a "+" operator so the formula remains valid.
  const simplified = [];
  simplified.push(new OperatorTerm({ operator: staticBonus < 0 ? "-" : "+" }));
  simplified.push(new NumericTerm({ number: Math.abs(staticBonus) }));

  return simplified;
}

/* -------------------------------------------------- */

/**
 * A helper function to group dice of the same size and sign into single dice terms.
 * @param {object[]} terms  An array of DiceTerms and associated OperatorTerms.
 * @returns {object[]}      A new array of simplified dice terms.
 */
function _simplifyDiceTerms(terms) {
  // Split the terms into different die sizes and signs
  const diceQuantities = terms.reduce((obj, curr, i) => {
    if (curr instanceof OperatorTerm) return obj;
    const { faces, modifiers } = curr;
    const key = `${terms[i - 1].operator}${faces}${modifiers.filterJoin("")}`;
    obj[key] ??= {};
    if ((curr._number instanceof Roll) && (curr._number.isDeterministic)) curr._number.evaluateSync();
    obj[key].number = (obj[key].number ?? 0) + curr.number;
    obj[key].modifiers = (obj[key].modifiers ?? []).concat(curr.modifiers);
    return obj;
  }, {});

  // Add new die and operator terms to simplified for each die size and sign
  const simplified = Object.entries(diceQuantities).flatMap(([key, { number, modifiers }]) => ([
    new OperatorTerm({ operator: key.charAt(0) }),
    new Die({ number, faces: parseInt(key.slice(1)), modifiers: [...new Set(modifiers)] }),
  ]));
  return simplified;
}

/* -------------------------------------------------- */

/**
 * A helper function to extract the contents of parenthetical terms into their own terms.
 * @param {object[]} terms  An array of roll terms.
 * @returns {object[]}      A new array of terms with no parenthetical terms.
 */
function _expandParentheticalTerms(terms) {
  terms = terms.flatMap(term => {
    if (term instanceof ParentheticalTerm) {
      if (term.isDeterministic) {
        const roll = new DSRoll(term.term);
        term = new NumericTerm({ number: roll.evaluateSync().total });
      } else {
        const subterms = new DSRoll(term.term).terms;
        term = _expandParentheticalTerms(subterms);
      }
    }
    return term;
  });
  return DSRoll.fromTerms(terms).terms;
}

/* -------------------------------------------------- */

/**
 * A helper function to group terms into PoolTerms, DiceTerms, FunctionTerms, and NumericTerms.
 * FunctionTerms are included as NumericTerms if they are deterministic.
 * @param {RollTerm[]} terms  An array of roll terms.
 * @returns {object}          An object mapping term types to arrays containing roll terms of that type.
 */
function _groupTermsByType(terms) {
  // Add an initial operator so that terms can be rearranged arbitrarily.
  if (!(terms[0] instanceof OperatorTerm)) terms.unshift(new OperatorTerm({ operator: "+" }));

  const getTermKey = term => {
    let type;
    if (term instanceof DiceTerm) type = DiceTerm;
    else if ((term instanceof FunctionTerm) && (term.isDeterministic)) type = NumericTerm;
    else type = term.constructor;
    return `${type.name.charAt(0).toLowerCase()}${type.name.substring(1)}s`;
  };

  return Object.groupBy(terms, (term, index) => {
    // OperatorTerms should be grouped with the term next term in the array.
    if (term instanceof OperatorTerm) return getTermKey(terms[index + 1]);
    else return getTermKey(term);
  });
}
