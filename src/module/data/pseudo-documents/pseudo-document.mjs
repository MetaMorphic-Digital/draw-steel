import { systemPath } from "../../constants.mjs";

/**
 * @import Document from "@common/abstract/document.mjs";
 * @import PseudoDocumentSheet from "../../applications/api/pseudo-document-sheet.mjs";
 * @import { PseudoDocumentMetadata } from "../_types";
 * @import ModelCollection from "../../utils/model-collection.mjs";
 */

const { DocumentIdField, StringField, FilePathField } = foundry.data.fields;

/**
 * A special subclass of data model that can be treated as a system-defined embedded document.
 */
export default class PseudoDocument extends foundry.abstract.DataModel {
  /**
   * Pseudo-document metadata.
   * @type {PseudoDocumentMetadata}
   */
  static get metadata() {
    return {
      documentName: null,
      icon: "",
      embedded: {},
      sheetClass: null,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      _id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
      name: new StringField({ required: true }),
      img: new FilePathField({ categories: ["IMAGE"] }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.PSEUDO"];

  /* -------------------------------------------------- */

  /**
   * Template for {@link createDialog}.
   */
  static CREATE_TEMPLATE = systemPath("templates/sheets/pseudo-documents/base-create-dialog.hbs");

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

  // /**
  //  * Fetches the collection this PseudoDocument is contained in.
  //  * @type {ModelCollection<this>}
  //  */
  // get collection() {
  //   return foundry.utils.getProperty(this.document, this.fieldPath);
  // }

  /* -------------------------------------------------- */

  /**
   * Reference to the sheet of this pseudo-document, registered in a static map.
   * A pseudo-document is temporary, unlike regular documents, so the relation here
   * is not one-to-one.
   * @type {PseudoDocumentSheet | null}
   */
  get sheet() {
    return ds.applications.api.PseudoDocumentSheet.getSheet(this);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configure(options = {}) {
    super._configure(options);
    Object.defineProperty(this, "collection", {
      value: options.collection ?? null,
      writable: false,
    });
  }

  /* -------------------------------------------------- */
  /*   Data preparation                                 */
  /* -------------------------------------------------- */

  /**
   * Prepare base data. This method is not called automatically; it is the responsibility
   * of the parent document to ensure pseudo-documents prepare base and derived data.
   */
  prepareBaseData() {
    const documentNames = Object.keys(this.constructor.metadata.embedded);
    for (const documentName of documentNames) {
      for (const pseudoDocument of this.getEmbeddedPseudoDocumentCollection(documentName)) {
        pseudoDocument.prepareBaseData();
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Prepare derived data. This method is not called automatically; it is the responsibility
   * of the parent document to ensure pseudo-documents prepare base and derived data.
   */
  prepareDerivedData() {
    const documentNames = Object.keys(this.constructor.metadata.embedded);
    for (const documentName of documentNames) {
      for (const pseudoDocument of this.getEmbeddedPseudoDocumentCollection(documentName)) {
        pseudoDocument.prepareDerivedData();
      }
    }
  }

  /* -------------------------------------------------- */
  /*   Instance Methods                                 */
  /* -------------------------------------------------- */

  /**
   * Construct a UUID relative to another document.
   * @param {Document} relative  The document to compare against.
   */
  getRelativeUUID(relative) {

    // This PseudoDocument is a sibling of the relative Document.
    if (this.collection === relative.collection) return `.${this.id}`;

    // This PseudoDocument may be a descendant of the relative Document, so walk up the hierarchy to check.
    const parts = [this.documentName, this.id];
    let parent = this.parent;
    while (parent) {
      if (parent === relative) break;
      // Skip intermediate non-Document/PseudoDocument data models
      if (parent.documentName) parts.unshift(parent.documentName, parent.id);
      parent = parent.parent;
    }

    // The relative Document was a parent or grandparent of this one.
    if (parent === relative) return `.${parts.join(".")}`;

    // The relative Document was unrelated to this one.
    return this.uuid;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve an embedded pseudo-document.
   * @param {string} embeddedName         The document name of the embedded pseudo-document.
   * @param {string} id                   The id of the embedded pseudo-document.
   * @param {object} [options]            Retrieval options.
   * @param {boolean} [options.invalid]   Retrieve an invalid pseudo-document?
   * @param {boolean} [options.strict]    Throw an error if the embedded pseudo-document does not exist?
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

  /**
   * Obtain the embedded collection of a given pseudo-document type.
   * @param {string} embeddedName   The document name of the embedded collection.
   * @returns {ModelCollection}     The embedded collection.
   */
  getEmbeddedPseudoDocumentCollection(embeddedName) {
    const collectionPath = this.constructor.metadata.embedded[embeddedName];
    if (!collectionPath) {
      throw new Error(`${embeddedName} is not a valid embedded Pseudo-Document within the [${this.type}] ${this.documentName} subtype!`);
    }
    return foundry.utils.getProperty(this, collectionPath);
  }

  /* -------------------------------------------------- */

  /**
   * Create drag data for storing on initiated drag events.
   * @returns {object}
   */
  toDragData() {
    return {
      type: this.documentName,
      uuid: this.uuid,
    };
  }

  /* -------------------------------------------------- */
  /*   CRUD Handlers                                    */
  /* -------------------------------------------------- */

  /**
   * Does this pseudo-document exist in the document's source?
   * @type {boolean}
   */
  get isSource() {
    const docName = this.documentName;
    const fieldPath = this.parent.constructor.metadata.embedded[docName];
    const parent = (this.parent instanceof foundry.abstract.TypeDataModel) ? this.parent.parent : this.parent;
    const source = foundry.utils.getProperty(parent._source, fieldPath);
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
   * @param {foundry.abstract.DataModel} operation.parent   The parent of this document.
   * @param {boolean} [operation.renderSheet]               Render the sheet of the created pseudo-document?
   * @returns {Promise<foundry.abstract.Document>}          A promise that resolves to the updated document.
   */
  static async create(data = {}, { parent, renderSheet = true, ...operation } = {}) {
    if (!parent) {
      throw new Error("A parent document must be specified for the creation of a pseudo-document!");
    }
    const id = operation.keepId && foundry.data.validators.isValidId(data._id) ? data._id : foundry.utils.randomID();

    const fieldPath = parent instanceof foundry.abstract.Document
      ? parent.system.constructor.metadata?.embedded?.[this.metadata.documentName]
      : parent.constructor.metadata?.embedded?.[this.metadata.documentName];
    if (!fieldPath) {
      throw new Error(`A ${parent.documentName} of type '${parent.type}' does not support ${this.metadata.documentName}!`);
    }

    const update = { [`${fieldPath}.${id}`]: { ...data, _id: id } };
    this._configureUpdates("create", parent, update, operation);
    await parent.update(update, operation);
    if (renderSheet) parent.getEmbeddedDocument(this.metadata.documentName, id).sheet?.render({ force: true });
    return parent;
  }

  /* -------------------------------------------------- */

  /**
   * Prompt for creating this pseudo-document.
   * @param {object} [data]                                 The data used for the creation.
   * @param {object} operation                              The context of the operation.
   * @param {foundry.abstract.Document} operation.parent    The parent of this document.
   * @returns {Promise<foundry.abstract.Document|null>}     A promise that resolves to the updated document.
   */
  static async createDialog(data = {}, { parent, ...operation } = {}) {
    // If there's demand or need we can make the template & context more dynamic
    const content = await foundry.applications.handlebars.renderTemplate(this.CREATE_TEMPLATE, this._prepareCreateDialogContext(parent));

    const result = await ds.applications.api.DSDialog.input({
      content,
      window: {
        title: game.i18n.format("DOCUMENT.New", { type: game.i18n.localize(`DOCUMENT.${this.metadata.documentName}`) }),
        icon: this.metadata.icon,
      },
      render: (event, dialog) => this._createDialogRenderCallback(event, dialog),
    });
    if (!result) return null;
    return this.create({ ...data, ...result }, { parent, ...operation });
  }

  /* -------------------------------------------------- */

  /**
   * Prepares context for use with {@link CREATE_TEMPLATE}.
   * @param {foundry.abstract.DataModel} parent
   * @returns {object}
   * @protected
   */
  static _prepareCreateDialogContext(parent) {
    return {
      fields: this.schema.fields,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Render callback for dynamic handling on the .
   * @param {Event} event
   * @param {ds.applications.api.DSDialog} dialog
   * @protected
   */
  static _createDialogRenderCallback(event, dialog) {}

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
