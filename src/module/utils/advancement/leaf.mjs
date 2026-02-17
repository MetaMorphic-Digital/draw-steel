import AdvancementNode from "./node.mjs";

/**
 * @import DrawSteelItem from "../../documents/item.mjs";
 */

/**
 * A leaf represents an individual choice on a node. It may have descendant nodes.
 */
export default class AdvancementLeaf {
  /**
   * @param {AdvancementNode} node
   * @param {string} key
   * @param {string} label
   * @param {object} [options={}]
   * @param {DrawSteelItem} [options.item]
   */
  constructor(node, key, label, options = {}) {
    Object.defineProperties(this, {
      node: { value: node, configurable: false, writable: false },
      key: { value: key, configurable: false, writable: false },
      label: { value: label, configurable: false, writable: false },
      item: { value: options.item ?? null, configurable: false, writable: false },
    });
  }

  /* -------------------------------------------------- */

  /**
   * The parent node of this leaf.
   * @type {AdvancementNode}
   */
  node;

  /* -------------------------------------------------- */

  /**
   * The key for this leaf in the node.
   * Likely has other significant depending on advancement type, e.g. Item UUID or trait value.
   * @type {string}
   */
  key;

  /* -------------------------------------------------- */

  /**
   * Has this been chosen for the advancement?
   * @type {boolean}
   */
  get isChosen() {
    return this.node.advancement.isChosen(this);
  }

  /* -------------------------------------------------- */

  /**
   * Label for this leaf.
   * @type {string}
   */
  label;

  /* -------------------------------------------------- */

  /**
   * Child nodes from this leaf. Only used by item grant advancements.
   * @type {Record<string, AdvancementNode> | null}
   */
  children = null;

  /* -------------------------------------------------- */

  /**
   * The item associated with this leaf's key. Only used by item grant advancements.
   * @type {DrawSteelItem | null}
   */
  item = null;
}
