import AdvancementNode from "./node.mjs";
import { systemID } from "../../constants.mjs";

/**
 * @import { DrawSteelActiveEffect, DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
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
    if (this.#actorClass === undefined) {
      // Hero with class
      if (this.actor.system.class) this.#actorClass = this.actor.system.class;
      else {
        // Pending class
        this.#actorClass = null;
        for (const node of this.activeNodes()) {
          const item = node.advancement.document;
          if (item.type === "class") {
            this.#actorClass = item;
            return item;
          }
        }
      }
    }
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
      if (node.advancement.type !== "itemGrant") continue;
      for (const uuid of (node.chosenSelection ?? [])) {
        const item = node.choices[uuid].item;
        if (item.type === "subclass") subclasses.add(item);
      }
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
    for (const advancement of item.getEmbeddedCollection("Advancement").sortedContents) {
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
    const existing = this.nodes.get(node.id);
    if (existing) this.removeNode(existing);
    this.nodes.set(node.id, node);
  }

  /* -------------------------------------------------- */

  /**
   * Remove a node.
   * @param {AdvancementNode} node
   */
  removeNode(node) {
    for (const n of node.children) this.removeNode(n);
    this.nodes.delete(node.id);
  }

  /* -------------------------------------------------- */

  /**
   * Perform the final document operations for this chain.
   * @param {object} config
   * @param {ItemData[]} [config.toCreate={}]
   * @param {ItemData[]} [config.toUpdate={}]
   * @param {ActorData} [config.actorUpdate={}]
   * @param {Map<string, string>} [config._idMap]
   * @param {object} [options]                                      Operation options.
   * @returns {Promise<[DrawSteelItem[], DrawSteelItem[], DrawSteelActor[], DrawSteelActiveEffect[]]>}
   */
  async finalize({ toCreate = {}, toUpdate = {}, actorUpdate = {}, _idMap = new Map() }, options = {}) {
    const operationOptions = foundry.utils.mergeObject({
      levels: this.levelRange,
    }, options);

    const effectOperation = {
      action: "create",
      data: [],
      ds: operationOptions,
      documentName: "ActiveEffect",
      keepId: true,
      pack: this.actor.pack,
      parent: this.actor,
    };
    actorUpdate._id = this.actor.id;

    // First gather all new items that are to be created.
    for (const node of this.activeNodes()) {
      if (node.advancement.type === "itemGrant") {
        const parentItem = node.advancement.document;

        for (const uuid of node.chosenSelection ?? []) {
          const item = node.choices[uuid].item;
          const keepId = !this.actor.items.has(item.id) && !Array.from(_idMap.values()).includes(item.id);
          const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
          if (!keepId) itemData._id = foundry.utils.randomID();
          toCreate[item.uuid] = itemData;
          _idMap.set(item.id, itemData._id);
          itemData._parentId = parentItem.id;
          itemData._advId = node.advancement.id;
        }
      }
      else if (node.advancement.type === "effectGrant") {
        const parentItem = node.advancement.document;

        for (const uuid of node.chosenSelection ?? []) {
          const effect = node.choices[uuid].effect;
          const keepId = !this.actor.effects.has(effect.id) && !Array.from(_idMap.values()).includes(effect.id);
          // there's no global effects collection but game.items is generic and safe
          const effectData = game.items.fromCompendium(effect, { keepId, clearFolder: true });
          effectData.origin = parentItem.uuid;
          foundry.utils.setProperty(effectData, `flags.${systemID}.advancement`, { parentId: parentItem.id, advancementId: node.advancement.id });
          if (!keepId) effectData._id = foundry.utils.randomID();
          effectOperation.data.push(effectData);
          _idMap.set(effect.id, effectData._id);
        }
      }
    }

    // Apply flags to store "parent" item's id and origin advancement.
    for (const uuid in toCreate) {
      const itemData = toCreate[uuid];
      const { _parentId, _advId } = itemData;
      delete itemData._parentId;
      delete itemData._advId;

      // Fall back to the _parentId, in the case of existing items being
      // updated to grant more items (eg a class leveling up).
      const parentId = _idMap.get(_parentId) ?? _parentId;
      foundry.utils.setProperty(itemData, `flags.${systemID}.advancement`, { parentId: parentId, advancementId: _advId });
    }

    // Perform item data modifications or store item updates.
    for (const node of this.activeNodes()) {
      if (node.advancement.isTrait || (node.advancement.type === "characteristic")) {
        const { document: item, id } = node.advancement;
        const isExisting = item.parent === this.actor;
        let itemData;

        if (isExisting) {
          toUpdate[item.id] ??= { _id: item.id };
          itemData = toUpdate[item.id];
        } else {
          itemData = toCreate[item.uuid];
        }

        foundry.utils.setProperty(itemData, `flags.${systemID}.advancement.${id}.selected`, node.chosenSelection);
      }
    }

    return foundry.documents.modifyBatch([
      {
        action: "create",
        data: Object.values(toCreate),
        ds: operationOptions,
        documentName: "Item",
        keepId: true,
        pack: this.actor.pack,
        parent: this.actor,
      },
      {
        documentName: "Item",
        action: "update",
        updates: Object.values(toUpdate),
        ds: operationOptions,
        parent: this.actor,
        pack: this.actor.pack,
      },
      {
        documentName: "Actor",
        action: "update",
        changes: [actorUpdate],
        ds: operationOptions,
        parent: this.actor.parent,
        pack: this.actor.pack,
      },
      effectOperation,
    ]);
  }
}
