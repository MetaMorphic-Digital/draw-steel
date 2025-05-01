const { EmbeddedDataField, TypedObjectField, TypedSchemaField } = foundry.data.fields;

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

/* -------------------------------------------------- */

/**
 * A subclass of TypedSchemaField that does not throw an error if the `type` of the
 * embedded model is invalid, e.g., due to disabled modules.
 */
class LazyTypedSchemaField extends TypedSchemaField {
  /** @inheritdoc */
  _validateSpecial(value) {
    if (!value || (value.type in this.types)) return super._validateSpecial(value);
    return true;
  }
}

/* -------------------------------------------------- */

/**
 * Specialized collection type for stored data models.
 * @param {Array<string, DataModel>} entries    Array containing the data models to store.
 */
class ModelCollection extends foundry.utils.Collection {
  /* -------------------------------------------------- */
  /*  Properties                                        */
  /* -------------------------------------------------- */

  /**
   * Pre-organized arrays of data models by type.
   * @type {Map<string, Set<string>>}
   */
  #types = new Map();

  /* -------------------------------------------------- */

  /**
   * The data models that originate from this parent document.
   * @type {PseudoDocument[]}
   */
  get sourceContents() {
    return this.filter(model => model.isSource);
  }

  /* -------------------------------------------------- */

  /**
   * A set of the un-initialized pseudo-documents.
   * Stored safely for debugging purposes.
   * @type {Set<object>}
   */
  #invalid = new Set();

  /* -------------------------------------------------- */
  /*  Methods                                           */
  /* -------------------------------------------------- */

  /**
   * Fetch an array of data models of a certain type.
   * @param {string} type     The subtype of the data models.
   * @returns {DataModel[]}   The data models of this type.
   */
  getByType(type) {
    return Array.from(this.#types.get(type) ?? []).map(key => this.get(key));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  set(key, value) {
    if (!this.#types.has(value.type)) this.#types.set(value.type, new Set());
    this.#types.get(value.type).add(key);
    return super.set(key, value);
  }

  /* -------------------------------------------------- */

  /**
   * Store invalid pseudo-documents.
   * @param {object} value    The un-initialized data model.
   */
  setInvalid(value) {
    this.#invalid.add(value);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  delete(key) {
    this.#types.get(this.get(key)?.type)?.delete(key);
    return super.delete(key);
  }

  /* -------------------------------------------------- */

  /**
   * Test the given predicate against every entry in the Collection.
   * @param {function(*, number, ModelCollection): boolean} predicate   The predicate.
   * @returns {boolean}
   */
  every(predicate) {
    return this.reduce((pass, v, i) => pass && predicate(v, i, this), true);
  }

  /* -------------------------------------------------- */

  /**
   * Convert the ModelCollection to an array of simple objects.
   * @returns {object[]}    The extracted array of primitive objects.
   */
  toObject() {
    return this.map(doc => doc.toObject(true));
  }
}
