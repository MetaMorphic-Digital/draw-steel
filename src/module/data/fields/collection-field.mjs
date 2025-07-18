import ModelCollection from "../../utils/model-collection.mjs";
import LazyTypedSchemaField from "./lazy-typed-schema-field.mjs";

/**
 * @import { DataFieldContext, DataFieldOptions } from "@common/data/_types.mjs";
 * @import PseudoDocument from "../pseudo-documents/pseudo-document.mjs";
 */

const { EmbeddedDataField, TypedObjectField } = foundry.data.fields;

/**
 * A collection that houses pseudo-documents.
 */
export default class CollectionField extends TypedObjectField {
  /**
   * @param {typeof PseudoDocument} model   The value type of each entry in this object.
   * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]    Additional context which describes the field.
   */
  constructor(model, options = {}, context = {}) {
    let field = foundry.utils.isSubclass(model, ds.data.pseudoDocuments.TypedPseudoDocument)
      ? new LazyTypedSchemaField(model.TYPES)
      : new EmbeddedDataField(model);
    options.validateKey ||= ((key) => foundry.data.validators.isValidId(key));
    super(field, options, context);
    this.#documentClass = model;
  }

  /* -------------------------------------------------- */

  /**
   * The pseudo-document class.
   * @type {typeof PseudoDocument}
   */
  #documentClass;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get documentClass() {
    return this.#documentClass;
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
    collection.documentClass = this.documentClass;
    return collection;
  }
}
