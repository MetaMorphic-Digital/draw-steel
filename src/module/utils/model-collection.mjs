/**
 * @import DataModel from "@common/abstract/data.mjs";
 * @import PseudoDocument from "../data/pseudo-documents/pseudo-document.mjs";
 * @import Collection from "@common/utils/collection.mjs";
 */

import BaseAdvancement from "../data/pseudo-documents/advancements/base-advancement.mjs";
import BasePowerRollEffect from "../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";

/**
 * Specialized collection type for stored data models.
 * @param {Array<string, DataModel>} entries    Array containing the data models to store.
 * @template {DataModel} Model The model class contained by this collection.
 * @extends {Collection<string, Model>}
 */
export default class ModelCollection extends foundry.utils.Collection {
  constructor(documentName, document, data) {
    super();
    const name = CONFIG[document.documentName].dataModels[document._source.type].metadata.embedded[documentName];
    Object.defineProperties(this, {
      name: { value: name, writable: false },
      _source: { value: data, writable: false },
      documentClass: { value: ModelCollection.documentClasses[documentName], writable: false },
    });
  }

  /* -------------------------------------------------- */
  /*  Properties                                        */
  /* -------------------------------------------------- */

  /**
   * Pseudo-document base model.
   * @type {typeof PseudoDocument}
   */
  documentClass;

  /* -------------------------------------------------- */

  /**
   * The base classes of the pseudo-documents that can be stored in a model such as this.
   * Each class must implement `documentConfig` to map to the subtype.
   * @type {Record<string, PseudoDocument>}
   */
  static documentClasses = {
    Advancement: BaseAdvancement,
    PowerRollEffect: BasePowerRollEffect,
  };

  /* -------------------------------------------------- */

  /**
   * A cache of this collection's contents grouped by subtype.
   * @type {Record<string, Model[]>|null}
   */
  #documentsByType = null;

  /* -------------------------------------------------- */

  /**
   * The data models that originate from this parent document.
   * @type {Model[]}
   */
  get sourceContents() {
    return this.filter(model => model.isSource);
  }

  /* -------------------------------------------------- */

  /**
   * The set of invalid document ids.
   * @param {Set<string>}
   */
  invalidDocumentIds = new Set();

  /* -------------------------------------------------- */

  /**
   * Underlying source data of each embedded pseudo-document. The
   * collection is responsible for performing mutations to this data.
   * @type {Record<string, object>}
   */
  _source;

  /* -------------------------------------------------- */
  /*  Methods                                           */
  /* -------------------------------------------------- */

  /**
   * The subtypes sorted by type.
   * @type {Record<string, Model[]>}
   */
  get documentsByType() {
    if (this.#documentsByType) return this.#documentsByType;
    const types = Object.fromEntries(Object.keys(this.documentClass.documentConfig).map(t => [t, []]));
    for (const doc of this.values()) types[doc._source.type ?? "base"]?.push(doc);
    return this.#documentsByType = types;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  set(key, value, { modifySource = true } = {}) {
    // Perform the modifications to the source when adding a new entry.
    if (modifySource) this._source[key] = value._source;
    if (super.get(key) !== value) this.#documentsByType = null;
    return super.set(key, value);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  delete(key, { modifySource = true } = {}) {
    // Handle modifications to the source data when deleting an entry.
    if (modifySource) delete this._source[key];
    const result = super.delete(key);
    if (result) this.#documentsByType = null;
    return result;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve an invalid document.
   * @param {string} id   The id of the invalid pseudo-document.
   * @param {object} [options={}]
   * @param {boolean} [options.strict=true]   Throw an error if the id does not exist.
   * @returns {Model|void}
   * @throws If the id does not exist.
   */
  getInvalid(id, { strict = true } = {}) {
    if (!this.invalidDocumentIds.has(id) && strict) {
      throw new Error(`The '${id}' does not exist in the invalid collection.`);
    }

    if (!this.invalidDocumentIds.has(id)) return;

    const data = this._source[id];
    const Cls = this.documentClass.documentConfig[data.type] ?? this.documentClass;
    return Cls.fromSource(foundry.utils.deepClone(data), { parent: this.parent });
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

  /* -------------------------------------------------- */

  /**
   * Initialize the model collection. Existing entries are retained, but new source data is used.
   * @param {foundry.abstract.DataModel} model    The parent data model that holds this collection.
   * @param {object} [options={}]
   */
  initialize(model, options = {}) {
    this.parent = model;
    this._initialized = false;
    this.#documentsByType = null;

    const initIds = new Set();
    for (const o of Object.values(this._source)) {
      const d = this.#initializeDocument(o, options);
      if (d) initIds.add(d.id);
    }

    if (this.size !== initIds.size) {
      for (const k of this.keys()) if (!initIds.has(k)) this.delete(k, { modifySource: false });
    }

    this._initialized = true;
  }

  /* -------------------------------------------------- */

  /**
   * Initialize a pseudo-document and store it in this collection.
   * If it exists, reinitialize with new data, otherwise create a new instance.
   * @param {object} data   Source data.
   * @param {object} [options]
   * @returns {Model|null}
   */
  #initializeDocument(data, options) {
    let d = this.get(data._id);
    if (d) {
      // The document exists, reinitialize with new source data.
      d._initialize(options);
      return d;
    }

    if (!data._id) {
      data._id = foundry.utils.randomID();
      console.warn(`PseudoDocument was constructed without an _id. Replaced with id '${data._id}'.`);
    }
    try {
      // Create a new instance.
      d = this.#createDocument(data, options);
      super.set(d.id, d);
    } catch (err) {
      this.#handleInvalidDocument(data._id, err, options);
      return null;
    }

    return d;
  }

  /* -------------------------------------------------- */

  /**
   * Create a new instance of the pseudo-document.
   * @param {object} data   Pseudo-document data.
   * @param {object} [context={}]
   * @returns {Model}
   */
  #createDocument(data, context = {}) {
    const Cls = this.documentClass.TYPES[data.type];
    if (!Cls)
      throw new Error(`Type '${data.type}' is not a valid subtype for a ${this.documentClass.metadata.documentName}.`);
    return new Cls(data, { ...context, parent: this.parent });
  }

  /* -------------------------------------------------- */

  /**
   * Emulate the core handling of invalid documents by throwing warnings, storing the id in the `invalidDocumentIds` set.
   * @param {string} id   The id of the model.
   * @param {string} err    The error message.
   * @param {object} [options={}]
   * @param {boolean} [options.strict=true]   Throw an error.
   */
  #handleInvalidDocument(id, err, { strict = true } = {}) {
    const documentName = this.documentClass.metadata.documentName;
    const parent = this.parent;
    this.invalidDocumentIds.add(id);

    // Wrap the error with more information
    const uuid = foundry.utils.buildUuid({ id, documentName, parent });
    const msg = `Failed to initialize ${documentName} [${uuid}]:\n${err.message}`;
    const error = new Error(msg, { cause: err });

    if (strict) console.error(error);
    else console.warn(error);
    if (strict) {
      globalThis.Hooks?.onError(`${this.constructor.name}#_initializeDocument`, error, { id, documentName });
    }
  }
}
