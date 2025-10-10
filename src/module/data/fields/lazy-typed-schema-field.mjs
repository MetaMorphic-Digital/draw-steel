
/**
 * A subclass of TypedSchemaField that does not throw an error if the `type` of the
 * embedded model is invalid, e.g., due to disabled modules.
 */
export default class LazyTypedSchemaField extends foundry.data.fields.TypedSchemaField {
  /** @inheritdoc */
  _validateSpecial(value) {
    if (!value || (value.type in this.types)) return super._validateSpecial(value);
    return true;
  }

  /* -------------------------------------------------- */

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    const s = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!s || !value) {
      source[key] = value;
      return;
    }

    // Update fields in source which changed in the diff
    const element = this.types[value.type];
    for (let [k, d] of Object.entries(diff)) {
      k = foundry.utils.isDeletionKey(k) ? k.slice(2) : k;
      const field = element.getField(k);
      if (!field) continue;
      field._updateCommit(s, k, value[k], d, options);
    }
  }
}
