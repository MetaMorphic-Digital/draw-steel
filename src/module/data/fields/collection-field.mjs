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

  /** @override */
  static hierarchical = true;

  /* -------------------------------------------------- */

  /**
   * The Collection implementation to use when initializing the collection.
   * @type {typeof ModelCollection}
   */
  static get implementation() {
    return ModelCollection;
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
    const name = this.documentClass.metadata.documentName;
    const collection = model.parent.pseudoCollections[name];
    collection.initialize(model, options);
    return collection;
  }

  /* -------------------------------------------------- */

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    let src = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!src || !value) {
      source[key] = value;
      return;
    }

    // Reconstruct the source array, retaining object references
    for (let [id, d] of Object.entries(diff)) {
      if (foundry.utils.isDeletionKey(id)) {
        if (id[0] === "-") {
          delete source[key][id.slice(2)];
          continue;
        }
        id = id.slice(2);
      }
      const prior = src[id];
      if (prior) {
        this.element._updateCommit(src, id, value[id], d, options);
        src[id] = prior;
      }
      else src[id] = d;
    }
  }
}
