import ModelCollection from "../../utils/model-collection.mjs";
import LazyTypedSchemaField from "./lazy-typed-schema-field.mjs";

const { EmbeddedDataField, TypedObjectField } = foundry.data.fields;

/**
 * A collection that houses pseudo-documents.
 */
export default class CollectionField extends TypedObjectField {
  constructor(model, options = {}, context = {}) {
    let field = foundry.utils.isSubclass(model, ds.data.pseudoDocuments.TypedPseudoDocument)
      ? new LazyTypedSchemaField(model.TYPES)
      : new EmbeddedDataField(model);
    options.validateKey ||= ((key) => foundry.data.validators.isValidId(key));
    super(field, options, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    const init = super.initialize(value, model, options);
    const collection = new ModelCollection();
    for (const [id, model] of Object.entries(init)) {
      if (model instanceof ds.data.pseudoDocuments.PseudoDocument) {
        collection.set(id, model);
      } else {
        collection.setInvalid(model);
      }
    }
    return collection;
  }
}
