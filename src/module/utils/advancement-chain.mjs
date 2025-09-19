import { TraitAdvancement } from "../data/pseudo-documents/advancements/_module.mjs";

/**
 * @import DrawSteelItem from "../documents/item.mjs";
 * @import { BaseAdvancement } from "../data/pseudo-documents/advancements/_module.mjs";
 * @import { AdvancementChainItemGrantLeaf } from "../_types";
 */

/**
 * Utility class for advancement chains.
 */
export default class AdvancementChain {
  constructor(chainLink) {
    Object.assign(this, chainLink);
  }

  /* -------------------------------------------------- */

  /**
   * Iterating over a chain should yield itself and any children and their children.
   * @yields {AdvancementChain}
   */
  *[Symbol.iterator]() {
    // eslint-disable-next-line @jsdoc/require-jsdoc
    function* yielder(node) {
      yield node;
      for (const k in node.choices) {
        for (const u in node.choices[k].children)
          yield * yielder(node.choices[k].children[u]);
      }
    }

    for (const c of yielder(this)) yield c;
  }

  /* -------------------------------------------------- */

  /**
   * Iterate through the nodes of the chain, but dismiss any children whose "parent" item
   * were explicitly not deselected. This can be used to determine which advancements in the
   * full chain of possibilities are currently active and valid.
   * @yields {AdvancementChain}
   */
  *active() {
    // eslint-disable-next-line @jsdoc/require-jsdoc
    function* yielder(node) {
      yield node;
      for (const k in node.choices) {
        const isSelected = !node.advancement.isChoice || !!node.selected[k];
        if (!isSelected) continue;
        for (const u in node.choices[k].children)
          yield * yielder(node.choices[k].children[u]);
      }
    }

    for (const c of yielder(this)) yield c;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve the node that contains a given advancement.
   * @param {string} uuid   The uuid of the advancement.
   * @returns {AdvancementChain|null}
   */
  getByAdvancement(uuid) {
    for (const node of this) if (node.advancement.uuid === uuid) return node;
    return null;
  }

  /* -------------------------------------------------- */
  /*   Factory Methods                                  */
  /* -------------------------------------------------- */

  /**
   * Create a new instance of instances of a chain.
   * @param {BaseAdvancement} root       An advancement or item with advancements.
   * @param {AdvancementChain} [parent]                         Parent chain link.
   * @param {object} [options={}]                               Additional information about this advancement chain.
   * @param {number} [options._depth=0]                         Current tree depth.
   * @param {number} [options.start=null]                       Starting level for advancements.
   * @param {number} [options.end=1]                            Final level for advancements.
   * @returns {Promise<AdvancementChain|AdvancementChain[]>}    A promise that resolves to the chain or chain link.
   */
  static async create(root, parent = null, options = {}) {
    const { _depth: _depth = 0, start: levelStart = null, end: levelEnd = 1 } = options;

    const advancement = root;
    const nodeData = {
      advancement, parent,
      depth: _depth,
      isRoot: !_depth,
      choices: {},
      selected: {},
    };

    const node = new this(nodeData);

    if (advancement.type === "itemGrant") {
      for (const { uuid } of advancement.pool) {
        const item = await fromUuid(uuid);
        if (!item) continue;

        node.choices[item.uuid] = await this.createItemGrantChoice(item, node, { levelStart, levelEnd, _depth });
      }
    } else if (advancement instanceof TraitAdvancement) {
      for (const trait of advancement.traitOptions) {
        const choice = node.choices[trait.value] = {
          node,
          choice: trait.label,
          trait: trait.value,
          children: {},
        };

        Object.defineProperty(choice, "isChosen", {
          get() {
            if (!node.isChosen) return false;
            if (!node.advancement.isChoice) return true;
            return node.selected[trait.value] === true;
          },
        });
      }
    }

    return node;
  }

  /**
   * Construct the choices for an item grant recursively.
   * @param {DrawSteelItem} item
   * @param {AdvancementChain} node
   * @param {object} config
   * @param {number} config.levelStart
   * @param {number} config.levelEnd
   * @param {number} config._depth
   * @returns {Promise<AdvancementChainItemGrantLeaf>}
   */
  static async createItemGrantChoice(item, node, { levelStart, levelEnd, _depth }) {
    const choice = {
      item, node,
      itemLink: item.toAnchor(),
      children: {},
    };

    Object.defineProperty(choice, "isChosen", {
      get() {
        if (!node.isChosen) return false;
        if (!node.advancement.isChoice) return true;
        return node.selected[item.uuid] === true;
      },
    });

    if (!item.supportsAdvancements) return choice;

    // Find any "child" advancements.
    for (const advancement of item.getEmbeddedPseudoDocumentCollection("Advancement")) {
      const validRange = advancement.levels.some(level => {
        if (Number.isNumeric(level)) return level.between(levelStart, levelEnd);
        else return levelStart === null;
      });
      if (validRange) {
        choice.children[advancement.uuid] = await AdvancementChain.create(advancement, node, {
          _depth: _depth + 1,
          start: levelStart,
          end: levelEnd,
        });
        choice.children[advancement.uuid].parentChoice = choice; // Helps detect if chosen.
      }
    }

    return choice;
  }

  /* -------------------------------------------------- */
  /*   Properties                                       */
  /* -------------------------------------------------- */

  /**
   * Validated number of choices to make. If this feasibly cannot be a choice of multiple options,
   * with some choices remaining leftover, this returns `null`. It otherwise returns the number of
   * choices the user can make.
   * @type {number|null}
   */
  get chooseN() {
    switch (this.advancement.type) {
      case "language":
      case "skill":
        if (!this.advancement.isChoice) return null;
        return this.advancement.chooseN;
      case "itemGrant":
        if (this.advancement.chooseN === null) return null;
        if (this.advancement.chooseN >= Object.values(this.choices).length) return null;
        return this.advancement.chooseN;
    }
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Is this advancement chosen and valid? I.e. If confirming, should it be applied?
   * It's either an advancement in the root, which are always applied, or it's from
   * an item granted by a "parent" item grant, in which case we check the "parent choice"
   * to see if *that* was chosen. This should recursively check up the chain until it
   * either finds the root, or a node that was not chosen or did not pick the relevant item.
   *
   * This should never be relevant for anything but root nodes or child nodes from item grants.
   * @type {boolean}
   */
  get isChosen() {
    if (this.isRoot) return true;
    return this.parentChoice.isChosen;
  }

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured, all choices made?
   * @type {boolean}
   */
  get isConfigured() {
    if (!this.advancement.isChoice) return true;
    const selected = Object.values(this.selected).reduce((acc, b) => acc + Boolean(b), 0);
    return selected === this.chooseN;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve the chosen selection. If no choice is involved, returns all choices.
   * @type {string[]|null}
   */
  get chosenSelection() {
    if (!this.isConfigured) return null;
    if (this.advancement.isChoice) return Object.entries(this.selected).filter(([, v]) => v).map(([k]) => k);
    return Object.keys(this.choices);
  }
}
