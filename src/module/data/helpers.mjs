import {DSRoll} from "../helpers/rolls.mjs";

const {NumberField, SchemaField, StringField} = foundry.data.fields;

/**
 * Constructs a schema field with a value and max attribute
 * @param {number} initial The starting value for the bar
 * @param {number} [min]   A minimum value for the fields
 * @returns A Schema with a value and max
 */
export const barAttribute = (initial, min) => new SchemaField({
  value: new NumberField({initial, min, nullable: false, integer: true}),
  max: new NumberField({initial, min, nullable: false, integer: true})
});

/**
 * Constructs a number field that is always a number with a min of 0
 * @param {object} [options] Options to forward to the field
 * @param {number} [options.initial=0] The initial value for the field
 * @param {string} [options.label] Label for the field
 * @returns A number field that is non-nullable and always defined
 */
export const requiredInteger = ({initial = 0, label} = {}) => new NumberField({initial, label, required: true, nullable: false, integer: true, min: 0});

/**
 * @callback DamageTypeCallback
 * @param {{label: string}} damageConfig
 * @returns {import("../../../foundry/common/data/fields.mjs").DataField} The SchemaField entry
 */

/**
 * Constructs a schema field with entries for each damage type
 * @param {DamageTypeCallback} inner Callback that returns a field
 * @returns A Schema with entries for each damage type
 */
export const damageTypes = (inner, {all = false, keywords = false} = {}) => {
  const schema = {};
  const config = ds.CONFIG;

  if (all) schema.all = inner();

  Object.entries(config.damageTypes).reduce((obj, [type, value]) => {
    obj[type] = inner({label: value.label});
    return obj;
  }, schema);

  if (keywords) {
    Object.entries(config.abilities.keywords).reduce((obj, [key, value]) => {
      if (value.damage) obj[key] = inner({label: value.label});
      return obj;
    }, schema);
  }

  return new SchemaField(schema);
};

/**
 * A data model to represent the size of a creature in Draw Steel
 */
export class SizeModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      value: new NumberField({initial: 1, required: true, nullable: false, integer: true, min: 1}),
      letter: new StringField({initial: "M", choices: ds.CONFIG.sizes})
    };
  }

  /** @override */
  toString() {
    const letter = this.value === 1 ? this.letter ?? "" : "";
    return this.value + letter;
  }
}

/**
 * Special case StringField which represents a formula.
 */
export class FormulaField extends foundry.data.fields.StringField {

  /** @override */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      required: true,
      deterministic: false
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _validateType(value) {
    DSRoll.validate(value);
    if (this.options.deterministic) {
      const roll = new Roll(value);
      if (!roll.isDeterministic) throw new Error("must not contain dice terms");
    }
    super._validateType(value);
  }

  /** @override */
  _applyChangeAdd(value, delta, model, change) {
    if (value) return value.concat(" + ", delta);
    else return delta;
  }
}
