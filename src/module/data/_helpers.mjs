const {NumberField, SchemaField} = foundry.data.fields;

/**
 * Constructs a schema field with a value and max attribute
 * @param {number} initial The starting value for the bar
 * @returns A Schema with a value and max
 */
export const barAttribute = (initial = 0) => new SchemaField({
  value: new NumberField({initial}),
  max: new NumberField({initial})
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
 * Constructs a schema field with entries for each damage type
 * @param {({label?: string}) => DataField} inner Callback that returns a field
 * @returns A Schema with entries for each damage type
 */
export const damageTypes = (inner, {all = false, keywords = false} = {}) => {
  const schema = {};
  const config = CONFIG.DRAW_STEEL;

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
