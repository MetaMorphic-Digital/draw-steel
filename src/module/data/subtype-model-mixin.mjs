/** @import { SubtypeMetadata } from "./_types" */

/**
 * Mixin for common functions used across most or all document subtypes.
 * @template {import("@common/_types.mjs").Constructor<foundry.abstract.TypeDataModel>} ModelClass
 * @param {ModelClass} base
 */
export default base => {
  // eslint-disable-next-line @jsdoc/require-jsdoc
  return class DrawSteelSystemModel extends base {
    /**
     * Metadata for this document subtype
     * @type {SubtypeMetadata}
     */
    static get metadata() {
      return {
        embedded: {},
      };
    }
  };
};
