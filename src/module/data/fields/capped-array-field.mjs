
/**
 * A special array field that enforces and slices to the max length.
 * @param {import("../../../../foundry/common/data/fields.mjs").ArrayFieldOptions} [options={}]  Options which configure the behavior of the field.
 */
export default class StatusSourceField extends foundry.data.fields.ArrayField {
  /** @override */
  _applyChangeAdd(value, delta, model, change) {
    const array = super._applyChangeAdd(value, delta, model, change);
    return array.slice(-this.max);
  }

  /** @override */
  _cast(value) {
    const array = super._cast(value);
    return array.slice(-this.max);
  }
}
