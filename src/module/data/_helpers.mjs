const {NumberField, SchemaField} = foundry.data.fields;

/**
 * Constructs a schema field with a value and max attribute
 * @param {number} initial The starting value for the bar
 * @returns {SchemaField} A Schema with a value and max
 */
export const barAttribute = (initial = 0) => new SchemaField({
  value: new NumberField({initial}),
  max: new NumberField({initial})
});

/**
 * Constructs a number field that is always a number with a min of 0
 * @param {number} initial The initial value for the field
 * @returns {NumberField} A number field that is non-nullable and always defined
 */
export const requiredInteger = (initial = 0) => new NumberField({initial, required: true, nullable: false, integer: true, min: 0});

/**
 * Constructs a schema field with entries for each damage type
 * @param {() => DataField} inner Callback that returns a field
 * @returns {SchemaField} A Schema with entries for each damage type
 */
export const damageTypes = (inner, extra = {}) => new SchemaField(
  Object.keys(CONFIG.DRAW_STEEL.damageTypes).reduce((obj, type) => {
    obj[type] = inner();
    return obj;
  }, extra)
);
