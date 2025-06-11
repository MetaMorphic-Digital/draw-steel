/**
 * Mixin for common functions used across most or all document classes in this system.
 * @mixin
 *
 */
export default base => {
  return class DrawSteelDocument extends base {
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
  };
};
