/** @import {FormulaFieldOptions} from "./_types" */

/**
 * Special case StringField which represents a formula.
 *
 * @param {FormulaFieldOptions} [options={}]  Options which configure the behavior of the field.
 * @property {boolean} deterministic=false    Is this formula not allowed to have dice values?
 */
export default class FormulaField extends foundry.data.fields.StringField {

  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      required: true,
      deterministic: false
    });
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _validateType(value) {
    if (this.options.deterministic) {
      const roll = new Roll(value);
      if (!roll.isDeterministic) throw new Error("must not contain dice terms");
    }
    super._validateType(value);
  }

  /* -------------------------------------------------- */
  /*  Active Effect Integration                         */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _castChangeDelta(delta) {
    // super just calls `_cast`
    return this._cast(delta).trim();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeAdd(value, delta, model, change) {
    if (!value) return delta;
    const operator = delta.startsWith("-") ? "-" : "+";
    delta = delta.replace(/^[+-]/, "").trim();
    return `${value} ${operator} ${delta}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeMultiply(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if (terms.length > 1) return `(${value}) * ${delta}`;
    return `${value} * ${delta}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeUpgrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if ((terms.length === 1) && (terms[0].fn === "max")) return current.replace(/\)$/, `, ${delta})`);
    return `max(${value}, ${delta})`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeDowngrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if ((terms.length === 1) && (terms[0].fn === "min")) return current.replace(/\)$/, `, ${delta})`);
    return `min(${value}, ${delta})`;
  }
}
