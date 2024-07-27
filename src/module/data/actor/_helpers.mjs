const {NumberField, SchemaField} = foundry.data.fields;

/**
 * Constructs a schema field with a value and max attribute
 * @param {number} initial The starting value for the bar
 * @returns
 */
export const barAttribute = (initial = 0) => new SchemaField({
  value: new NumberField({initial}),
  max: new NumberField({initial})
});
