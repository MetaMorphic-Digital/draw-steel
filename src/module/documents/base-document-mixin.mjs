/** @import Document from "@common/abstract/document.mjs"; */

/**
 * Mixin for common functions used across most or all document classes in this system.
 * Requires the document to have a `system` field.
 * @template {import("@common/_types.mjs").Constructor<Document>} BaseDocument
 * @param {BaseDocument} base
 *
 */
export default base => {
  return class DrawSteelDocument extends base {
    /** @inheritdoc */
    getEmbeddedDocument(embeddedName, id, { invalid = false, strict = false } = {}) {
      const systemEmbeds = this.system.constructor.metadata.embedded ?? {};
      if (embeddedName in systemEmbeds) {
        const path = systemEmbeds[embeddedName];
        return foundry.utils.getProperty(this, path).get(id, { invalid, strict }) ?? null;
      }
      return super.getEmbeddedDocument(embeddedName, id, { invalid, strict });
    }
  };
};
