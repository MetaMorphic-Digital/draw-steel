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

export const requiredInteger = (initial = 0) => new NumberField({initial, required: true, nullable: false, integer: true, min: 0});
