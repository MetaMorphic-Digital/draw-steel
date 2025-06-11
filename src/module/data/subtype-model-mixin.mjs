/** @import { SubtypeMetadata } from "./_types" */

/**
 * Mixin for common functions used across most or all document subtypes.
 * @template {import("@common/_types.mjs").Constructor<foundry.abstract.TypeDataModel>} ModelClass
 * @param {ModelClass} base
 */
export default base => {
  return class DrawSteelSystemModel extends base {
    /** @type {SubtypeMetadata} */
    static get metadata() {
      return {
        embedded: {},
      };
    }
  };
};
