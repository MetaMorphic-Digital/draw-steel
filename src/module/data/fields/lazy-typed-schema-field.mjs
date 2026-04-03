
/**
 * A subclass of TypedSchemaField that does not throw an error if the `type` of the
 * embedded model is invalid, e.g., due to disabled modules.
 */
export default class LazyTypedSchemaField extends foundry.data.fields.TypedSchemaField {
  /** @inheritdoc */
  _validateSpecial(value) {
    const invalidType = (typeof value.type === "string") && !(value.type in this.types);
    if (invalidType) return true;
    return super._validateSpecial(value);
  }
}
