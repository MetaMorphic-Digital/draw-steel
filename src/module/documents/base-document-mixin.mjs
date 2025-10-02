/**
 * @import Document from "@common/abstract/document.mjs";
 * @import { Constructor } from "@common/_types.mjs";
 */

/**
 * Mixin for common functions used across most or all document classes in this system.
 * Requires the document to have a `system` field.
 * @template {Constructor<Document>} BaseDocument
 * @param {BaseDocument} base
 *
 */
export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class DrawSteelDocument extends base {
    /** @inheritdoc */
    _configure(options = {}) {
      super._configure(options);

      const collections = {};
      const model = CONFIG[this.documentName].dataModels[this._source.type];
      const embedded = model?.metadata?.embedded ?? {};
      for (const [documentName, fieldPath] of Object.entries(embedded)) {
        const data = foundry.utils.getProperty(this._source, fieldPath);
        const field = model.schema.getField(fieldPath.slice("system.".length));
        const c = collections[documentName] = new field.constructor.implementation(documentName, this, data);
        Object.defineProperty(this, documentName, { value: c, writable: false });
      }

      Object.defineProperty(this, "pseudoCollections", { value: Object.seal(collections), writable: false });
    }

    /* -------------------------------------------------- */

    /**
     * Obtain the embedded collection of a given pseudo-document type.
     * @param {string} embeddedName   The document name of the embedded collection.
     * @returns {ModelCollection}     The embedded collection.
     */
    getEmbeddedPseudoDocumentCollection(embeddedName) {
      const collectionPath = this.system?.constructor.metadata.embedded?.[embeddedName];
      if (!collectionPath) {
        throw new Error(`${embeddedName} is not a valid embedded Pseudo-Document within the [${this.type}] ${this.documentName} subtype!`);
      }
      return foundry.utils.getProperty(this, collectionPath);
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    getEmbeddedDocument(embeddedName, id, { invalid = false, strict = false } = {}) {
      const systemEmbeds = this.system?.constructor.metadata.embedded ?? {};
      if (embeddedName in systemEmbeds) {
        const path = systemEmbeds[embeddedName];
        return foundry.utils.getProperty(this, path).get(id, { invalid, strict }) ?? null;
      }
      return super.getEmbeddedDocument(embeddedName, id, { invalid, strict });
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    prepareBaseData() {
      super.prepareBaseData();
      const documentNames = Object.keys(this.system?.constructor.metadata?.embedded ?? {});
      for (const documentName of documentNames) {
        for (const pseudoDocument of this.getEmbeddedPseudoDocumentCollection(documentName)) {
          pseudoDocument.prepareBaseData();
        }
      }
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    prepareDerivedData() {
      super.prepareDerivedData();
      const documentNames = Object.keys(this.system?.constructor.metadata?.embedded ?? {});
      for (const documentName of documentNames) {
        for (const pseudoDocument of this.getEmbeddedPseudoDocumentCollection(documentName)) {
          pseudoDocument.prepareDerivedData();
        }
      }
    }
  };
};
