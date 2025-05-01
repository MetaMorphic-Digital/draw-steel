/** @import { SubtypeMetadata } from "./_types" */

/**
 * Mixin for common functions used across most or all document subtypes.
 * @mixin
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
