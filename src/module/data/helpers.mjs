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
export const damageTypes = (inner, {all = false} = {}) => {
  const schema = {};
  const config = ds.CONFIG;

  if (all) schema.all = inner();

  Object.entries(config.damageTypes).reduce((obj, [type, value]) => {
    obj[type] = inner({label: value.label});
    return obj;
  }, schema);

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
 * Data Model variant that does not export fields with an `undefined` value during `toObject(true)`.
 * Copied from dnd5e.
 */
export class SparseDataModel extends foundry.abstract.DataModel {
  /** @inheritDoc */
  toObject(source = true) {
    if (!source) return super.toObject(source);
    const clone = foundry.utils.flattenObject(this._source);
    // Remove any undefined keys from the source data
    Object.keys(clone).filter(k => clone[k] === undefined).forEach(k => delete clone[k]);
    return foundry.utils.expandObject(clone);
  }
}
