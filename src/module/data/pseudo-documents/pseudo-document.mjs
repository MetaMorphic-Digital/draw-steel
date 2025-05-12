/** @import PseudoDocumentSheet from "../../applications/api/pseudo-document-sheet.mjs"; */

const { DocumentIdField } = foundry.data.fields;

/** @import { PseudoDocumentMetadata } from "../_types" */

export default class PseudoDocument extends foundry.abstract.DataModel {
  /**
   * Pseudo-document metadata.
   * @type {PseudoDocumentMetadata}
   */
  static get metadata() {
    return {
      documentName: null,
      label: "",
      icon: "",
      embedded: {},
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      _id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
    };
  }

  /* -------------------------------------------------- */

  static LOCALIZATION_PREFIXES = ["DOCUMENT"];

  /* -------------------------------------------------- */

  /**
   * The id of this pseudo-document.
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /* -------------------------------------------------- */

  /**
   * The document name of this pseudo document.
   * @type {string}
   */
  get documentName() {
    return this.constructor.metadata.documentName;
  }

  /* -------------------------------------------------- */

  /**
   * The uuid of this document.
   * @type {string}
   */
  get uuid() {
    let parent = this.parent;
    while (!(parent instanceof PseudoDocument) && !(parent instanceof foundry.abstract.Document)) parent = parent.parent;
    return [parent.uuid, this.documentName, this.id].join(".");
  }

  /* -------------------------------------------------- */

  /**
   * The parent document of this pseudo-document.
   * @type {Document}
   */
  get document() {
    let parent = this;
    while (!(parent instanceof foundry.abstract.Document)) parent = parent.parent;
    return parent;
  }

  /* -------------------------------------------------- */

  /**
   * The property path to this pseudo document relative to its parent document.
   * @type {string}
   */
  get fieldPath() {
    const fp = this.schema.fieldPath;
    let path = fp.slice(0, fp.lastIndexOf("element") - 1);

    if (this.parent instanceof PseudoDocument) {
      path = [this.parent.fieldPath, this.parent.id, path].join(".");
    }

    return path;
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the sheet of this pseudo-document, registered in a static map.
   * A pseudo-document is temporary, unlike regular documents, so the relation here
   * is not one-to-one.
   * @type {PseudoDocumentSheet | null}
   */
  get sheet() {
    return ds.applications.api.PseudoDocumentSheet._registerSheet(this);
  }

  /* -------------------------------------------------- */
  /*   Data preparation                                 */
  /* -------------------------------------------------- */

  /**
   * Prepase base data. This method is not called automatically; it is the responsibility
   * of the parent document to ensure pseudo-documents prepare base and derived data.
   */
  prepareBaseData() {}

  /* -------------------------------------------------- */

  /**
   * Prepare derived data. This method is not called automatically; it is the responsibility
   * of the parent document to ensure pseudo-documents prepare base and derived data.
   */
  prepareDerivedData() {}

  /* -------------------------------------------------- */
  /*   Instance Methods                                 */
  /* -------------------------------------------------- */

  /**
   * Retrieve an embedded pseudo-document.
   * @param {string} embeddedName         The document name of the embedded pseudo-document.
   * @param {string} id                   The id of the embedded pseudo-document.
   * @param {object} [options]            Retrieval options.
   * @param {boolean} [options.invalid]   Retrieve an invalid pseudo-document?
   * @param {boolean} [options.strinct]   Throw an error if the embedded pseudo-document does not exist?
   * @returns {PseudoDocument|null}
   */
  getEmbeddedDocument(embeddedName, id, { invalid = false, strict = false } = {}) {
    const embeds = this.constructor.metadata.embedded ?? {};
    if (embeddedName in embeds) {
      const path = embeds[embeddedName];
      return foundry.utils.getProperty(this, path).get(id, { invalid, strict }) ?? null;
    }
    return null;
  }

  /* -------------------------------------------------- */
  /*   CRUD Handlers                                    */
  /* -------------------------------------------------- */

  /**
   * Does this pseudo-document exist in the document's source?
   * @type {boolean}
   */
  get isSource() {
    const source = foundry.utils.getProperty(this.document._source, this.fieldPath);
    if (foundry.utils.getType(source) !== "Object") {
      throw new Error("Source is not an object!");
    }
    return this.id in source;
  }

  /* -------------------------------------------------- */

  /**
   * Create a new instance of this pseudo-document.
   * @param {object} [data]                                 The data used for the creation.
   * @param {object} operation                              The context of the operation.
   * @param {foundry.abstract.Document} operation.parent    The parent of this document.
   * @returns {Promise<foundry.abstract.Document>}          A promise that resolves to the updated document.
   */
  static async create(data = {}, { parent, ...operation } = {}) {
    if (!parent) {
      throw new Error("A parent document must be specified for the creation of a pseudo-document!");
    }
    const id = operation.keepId && foundry.data.validators.isValidId(data._id) ? data._id : foundry.utils.randomID();

    const fieldPath = parent.system.constructor.metadata.embedded?.[this.metadata.documentName];
    if (!fieldPath) {
      throw new Error(`A ${parent.documentName} of type '${parent.type}' does not support ${this.metadata.documentName}!`);
    }

    const update = { [`${fieldPath}.${id}`]: { ...data, _id: id } };
    this._configureUpdates("create", parent, update, operation);
    return parent.update(update, operation);
  }

  /* -------------------------------------------------- */

  /**
   * Delete this pseudo-document.
   * @param {object} [operation]                      The context of the operation.
   * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
   */
  async delete(operation = {}) {
    if (!this.isSource) throw new Error("You cannot delete a non-source pseudo-document!");
    Object.assign(operation, { pseudo: { operation: "delete", type: this.constructor.documentName, uuid: this.uuid } });
    const update = { [`${this.fieldPath}.-=${this.id}`]: null };
    this.constructor._configureUpdates("delete", this.document, update, operation);
    return this.document.update(update, operation);
  }

  /* -------------------------------------------------- */

  /**
   * Duplicate this pseudo-document.
   * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
   */
  async duplicate() {
    if (!this.isSource) throw new Error("You cannot duplicate a non-source pseudo-document!");
    const activityData = foundry.utils.mergeObject(this.toObject(), {
      name: game.i18n.format("DOCUMENT.CopyOf", { name: this.name }),
    });
    return this.constructor.create(activityData, { parent: this.document });
  }

  /* -------------------------------------------------- */

  /**
   * Update this pseudo-document.
   * @param {object} [change]                         The change to perform.
   * @param {object} [operation]                      The context of the operation.
   * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
   */
  async update(change = {}, operation = {}) {
    if (!this.isSource) throw new Error("You cannot update a non-source pseudo-document!");
    const path = [this.fieldPath, this.id].join(".");
    const update = { [path]: change };
    this.constructor._configureUpdates("update", this.document, update, operation);
    return this.document.update(update, operation);
  }

  /* -------------------------------------------------- */

  /**
   * Allow for subclasses to configure the CRUD workflow.
   * @param {"create"|"update"|"delete"} action     The operation.
   * @param {foundry.abstract.Document} document    The parent document.
   * @param {object} update                         The data used for the update.
   * @param {object} operation                      The context of the operation.
   */
  static _configureUpdates(action, document, update, operation) {}
}
