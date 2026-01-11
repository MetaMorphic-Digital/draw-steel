/**
 * @import BaseAdvancement from "../../data/pseudo-documents/advancements/base-advancement.mjs";
 * @import DrawSteelActor from "../../documents/actor.mjs";
 * @import AdvancementChain from "./chain.mjs";
 * @import AdvancementLeaf from "./leaf.mjs";
 */

/**
 * A node of an advancement chain.
 */
export default class AdvancementNode {
  /**
   *
   * @param {BaseAdvancement} advancement     The advancement held by this node.
   * @param {AdvancementChain} chain          The chain that holds this node.
   * @param {object} config
   * @param {AdvancementLeaf} [config.parent] A parent leaf.
   */
  constructor(advancement, chain, { parent = null }) {
    Object.defineProperties(this, {
      advancement: { value: advancement, writable: false, configurable: false },
      chain: { value: chain, writable: false, configurable: false },
      parent: { value: parent, writable: false, configurable: false },
      choices: { value: {}, writable: false, configurable: false },
    });
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.chain.actor;
  }

  /* -------------------------------------------------- */

  /**
   * The advancement of this node.
   * @type {BaseAdvancement}
   */
  advancement;

  /* -------------------------------------------------- */

  /**
   * The containing advancement chain.
   * @type {AdvancementChain}
   */
  chain;

  /* -------------------------------------------------- */

  /**
   * Choice leaves for this node.
   * @type {Record<string, AdvancementLeaf>}
   */
  choices;

  /* -------------------------------------------------- */

  /**
   * Advancement nodes that have this node as a parent.
   * @type {AdvancementNode[]}
   */
  get children() {
    const children = [];
    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        if (node.parentNode === this) children.push(node);
      }
    }
    return children;
  }

  /* -------------------------------------------------- */

  /**
   * The depth of this node.
   * @type {number}
   */
  get depth() {
    let depth = 0;
    let parent = this.parent;
    while (parent) {
      depth++;
      parent = parent.parent;
    }
    return depth;
  }

  /* -------------------------------------------------- */

  /**
   * Unique id to identify this node.
   * @type {string}
   */
  get id() {
    return this.advancement.id;
  }

  /* -------------------------------------------------- */

  /**
   * A sorting index in the application for the form of this node.
   * @type {number}
   */
  get index() {
    if (this.parent) {
      const first = this.parentNode.index + 1;
      const second = this.parentNode.children.indexOf(this) + 1;
      return first * 10 + second;
    }

    let i = 0;
    loop: for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        if (node === this) break loop;
        if (!node.depth) i++;
      }
    }
    return i;
  }

  /* -------------------------------------------------- */

  /**
   * Has this node been chosen?
   * @type {boolean}
   */
  get isChosen() {
    if (!this.parent) return true;
    return this.parent.isChosen && this.parentNode.isChosen;
  }

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return this.advancement.isConfigured;
  }

  /* -------------------------------------------------- */

  /**
   * The level the actor is advancing to.
   * @type {number}
   */
  get level() {
    return this.chain.level;
  }

  /* -------------------------------------------------- */

  /**
   * A parent leaf that resulted in the creation of this node.
   * @type {AdvancementLeaf|null}
   */
  parent;

  /* -------------------------------------------------- */

  /**
   * A parent node that resulted in the creation of this node.
   * @type {AdvancementNode}
   */
  get parentNode() {
    return this.parent?.node ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Selected leaves from this node.
   * @type {Record<string, boolean | number>}
   */
  selected = {};

  /* -------------------------------------------------- */

  /**
   * Traverse descendant nodes.
   * @yields {AdvancementNode}
   */
  * descendants() {
    for (const child of this.children) {
      yield child;
      yield* child.descendants();
    }
  }
}
