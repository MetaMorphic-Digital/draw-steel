const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Constructs a number field that is always a number with a min of 0.
 * @param {object} [options] Options to forward to the field.
 * @param {number} [options.initial=0]  The initial value for the field.
 * @param {number} [options.min=0]      The minimum value for the field.
 * @param {number} [options.max]        The maximum value for the field.
 * @param {string} [options.label]      Label for the field.
 * @returns A number field that is non-nullable and always defined.
 */
export const requiredInteger = ({ initial = 0, min = 0, max, label } = {}) => new NumberField({ initial, label, min, max, required: true, nullable: false, integer: true });

/* -------------------------------------------------- */

/**
 * Constructs a string field for use inside of a SetField.
 * @param {object} [options] Options to forward to the field.
 * @returns A string field that is always truthy.
 */
export const setOptions = (options) => new StringField({ required: true, blank: false, ...options });

/* -------------------------------------------------- */

/**
 * @callback DamageTypeCallback
 * @param {{label: string}} damageConfig
 * @returns {import("@common/data/fields.mjs").DataField} The SchemaField entry.
 */

/**
 * Constructs a schema field with entries for each damage type.
 * @param {DamageTypeCallback} inner Callback that returns a field.
 * @returns A Schema with entries for each damage type.
 */
export const damageTypes = (inner, { all = false } = {}) => {
  const schema = {};
  const config = ds.CONFIG;

  if (all) schema.all = inner();

  Object.entries(config.damageTypes).reduce((obj, [type, value]) => {
    obj[type] = inner({ label: value.label });
    return obj;
  }, schema);

  return new SchemaField(schema);
};

/**
 * Validates if a DSID fulfills our parameters.
 * @param {string} dsid
 */
export const validateDSID = (dsid) => {
  // Valid slug
  const slug = dsid.slugify({ strict: true });
  // multi-slugging can continue to mutate, this checks if the mutation is *only* from the middle mutation.
  const reSlug = dsid.replace(/[\s-]+/g, "-");

  return [dsid, reSlug].includes(slug);
};
