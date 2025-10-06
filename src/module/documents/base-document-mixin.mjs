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
        collections[documentName] = new field.constructor.implementation(documentName, this, data);
      }

      Object.defineProperty(this, "pseudoCollections", { value: Object.seal(collections), writable: false });
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    getEmbeddedCollection(embeddedName) {
      return this.pseudoCollections[embeddedName] ?? super.getEmbeddedCollection(embeddedName);
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    prepareBaseData() {
      super.prepareBaseData();

      for (const collection of Object.values(this.pseudoCollections))
        for (const pseudo of collection)
          pseudo.prepareBaseData();
    }

    /* -------------------------------------------------- */

    /** @inheritdoc */
    prepareDerivedData() {
      super.prepareDerivedData();

      for (const collection of Object.values(this.pseudoCollections))
        for (const pseudo of collection)
          pseudo.prepareDerivedData();
    }
  };
};
