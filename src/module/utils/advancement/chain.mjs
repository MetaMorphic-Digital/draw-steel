import AdvancementNode from "./node.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 * @import BaseAdvancement from "../../data/pseudo-documents/advancements/base.mjs";
 * @import AdvancementLeaf from "./leaf.mjs";
 */

/**
 * @typedef LevelRange
 * @property {number} start
 * @property {number} end
 */

/**
 * A container for advancement nodes.
 */
export default class AdvancementChain {
  /**
   * @param {DrawSteelActor} actor
   * @param {LevelRange} levelRange
   */
  constructor(actor, levelRange) {
    // TODO: Other actor types will likely support advancements in the future
    if (actor.type !== "hero") {
      throw new Error("Unable to create AdvancementChain for actor types other than 'hero'.");
    }
    Object.defineProperty(this, "actor", { value: actor, configurable: false, writable: false });

    const maxLevel = ds.CONFIG.hero.xpTrack.length;

    if (!levelRange.end.between(null, maxLevel)) {
      throw new Error("The AdvancementChain level is out of bounds.");
    }
    Object.defineProperties(this, {
      levelRange: { value: levelRange, configurable: false, writable: false },
      nodes: { value: new Map(), configurable: false, writable: false },
    });
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {DrawSteelActor}
   */
  actor;

  /* -------------------------------------------------- */

  /**
   * A cached reference to the actor's class or pending class.
   * Cached because classes cannot be changed/granted.
   * @type {DrawSteelItem}
   */
  #actorClass;

  /**
   * The actor's class or pending class.
   * @returns {DrawSteelItem | null} Returns null if the actor doesn't have a class already and this isn't to give one,
   *  e.g. If you add an Ancestry before a Class.
   */
  get actorClass() {
    // Cache hit
    if (this.#actorClass !== undefined) return this.#actorClass;
    // Hero with class
    else if (this.actor.system.class) {
      this.#actorClass = this.actor.system.class;
      return this.#actorClass;
    }
    // Pending class
    for (const node of this.activeNodes()) {
      const item = node.advancement.document;
      if (item.type === "class") {
        this.#actorClass = item;
        return item;
      }
    }

    this.#actorClass = null;
    return this.#actorClass;
  }

  /* -------------------------------------------------- */

  /**
   * The actor's subclasses and pending subclasses.
   * *Not* cached because these can change during the advancement selection process.
   * @type {Set<DrawSteelItem>}
   */
  get actorSubclasses() {
    /**
     * Existing subclasses.
     * @type {Set<DrawSteelItem>}
     */
    const subclasses = this.actor.system.subclasses;

    // Pending subclasses
    for (const node of this.activeNodes()) {
      const item = node.advancement.document;
      if (item.type === "subclass") subclasses.add(item);
    }

    return subclasses;
  }

  /* -------------------------------------------------- */

  /**
   * Is the chain initialized?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * Is the chain fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    for (const nodes of this.nodes.values()) {
      for (const node of nodes) {
        if (!node.isConfigured) return false;
      }
    }
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * The start and end level for the .
   * @type {LevelRange}
   */
  levelRange;

  /* -------------------------------------------------- */

  /**
   * Nodes in the chain. The key is the .
   * @type {Map<string, AdvancementNode>}
   */
  nodes;

  /* -------------------------------------------------- */

  /**
   * The chain's active nodes.
   * @yields {AdvancementNode}
   */
  * activeNodes() {
    for (const node of this.nodes.values()) {
      if (node.active) yield node;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Initialize the chain, creating the root nodes and their initial leaves.
   * @param {object} [options={}]
   * @param {DrawSteelItem} [options.item]          A single compendium item being added to an actor that needs to apply advancements.
   * @param {BaseAdvancement} [options.advancement] A single advancement (likely being reconfigured).
   * @returns {Promise<void>}   A promise that resolves once the chain is initialized.
   */
  async initializeRoots(options = {}) {
    if (this.#initialized) throw new Error("An AdvancementChain cannot be initialized more than once.");

    if (options.advancement) {
      await this.#createNodeForAdvancement(options.advancement, options);
    }
    else {
      const items = options.item ? [options.item] : this.actor.items;
      await Promise.allSettled(items.map(i => this.createNodes(i)).flat());
    }
    this.#initialized = true;
  }

  /* -------------------------------------------------- */

  /**
   * Create and initialize nodes for an item's advancements.
   * @param {DrawSteelItem} item                    An item that has an Advancement collection.
   * @param {object} [options]
   * @param {AdvancementLeaf} [options.parentLeaf]  A parent leaf for the node, used by item grants.
   * @returns {Array<Promise<void>>}
   */
  createNodes(item, options = {}) {
    const promises = [];
    if (!item.supportsAdvancements) return promises;
    const { start: levelStart, end: levelEnd } = this.levelRange;
    for (const advancement of item.getEmbeddedCollection("Advancement")) {
      const validRange = advancement.levels.some(level => {
        if (Number.isNumeric(level)) return level.between(levelStart, levelEnd);
        else return levelStart === null;
      });
      if (!validRange) continue;
      promises.push(this.#createNodeForAdvancement(advancement, options));
    }
    return promises;
  }

  /* -------------------------------------------------- */

  /**
   * Create and initialize a node for a single advancement.
   * @param {BaseAdvancement} advancement           An individual advancement to be turned into a node.
   * @param {object} [options]
   * @param {AdvancementLeaf} [options.parentLeaf]  A parent leaf for the node, used by item grants.
   * @returns {Promise<void>}
   */
  async #createNodeForAdvancement(advancement, options = {}) {
    const node = new AdvancementNode(advancement, this, { parent: options.parentLeaf ?? null });
    this.addNode(node);
    return advancement.createLeaves(node);
  }

  /* -------------------------------------------------- */

  /**
   * Add a node.
   * @param {AdvancementNode} node
   */
  addNode(node) {
    this.nodes.set(node.id, node);
  }

  /* -------------------------------------------------- */

  /**
   * Remove a node.
   * @param {AdvancementNode} node
   */
  removeNode(node) {
    this.nodes.delete(node.id);
  }
}
