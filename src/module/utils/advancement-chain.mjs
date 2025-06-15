/**
 * Utility class for advancement chains.
 * @extends {import("../_types").AdvancementChainLink}
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

    function* yielder(node) {
      yield node;
      for (const k in node.children) {
        yield * yielder(node.children[k]);
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
    function* yielder(node) {
      yield node;
      for (const k in node.children) {
        const a = node.children[k].advancement;
        const itemUuid = a.document.uuid;
        const selected = node.pool.some(p => (p.item.uuid === itemUuid) && (p.selected !== false));
        if (selected) yield * yielder(node.children[k]);
      }
    }

    for (const c of yielder(this)) yield c;
  }

  /* -------------------------------------------------- */

  /**
   * Set an item as selected or not selected.
   * @param {string} advancementUuid    The uuid of the advancement that granted the item.
   * @param {string} itemUuid           The uuid of the item that is granted by the advancement.
   * @param {boolean} [selected=true]   Whether the item is set as selected or not.
   * @returns {boolean}                 Whether a change was made.
   */
  selectItem(advancementUuid, itemUuid, selected = true) {
    let success = false;
    selected = !!selected;

    for (const node of this)
      if (node.advancement.uuid === advancementUuid)
        for (const p of node.pool)
          if ((p.item.uuid === itemUuid) && (p.optional) && (p.selected !== selected)) {
            p.selected = selected;
            success = true;
          }

    return success;
  }
}
