import BaseDocumentMixin from "./base-document-mixin.mjs";

// Necessary for continued type functionality with mixin
/** @import Item from "@client/documents/item.mjs"; */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Item.documentClass
 * @extends Item
 */
export default class DrawSteelItem extends BaseDocumentMixin(foundry.documents.Item) {
  /** @inheritdoc */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};

    // Shallow copy
    rollData.item = { ...this.system, flags: this.flags, name: this.name };

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareItemData", this);
  }

  /* -------------------------------------------------- */
  /*   Advancements                                     */
  /* -------------------------------------------------- */

  /**
   * Does this item type support advancements?
   * @type {boolean}
   */
  get supportsAdvancements() {
    return !!this.system.constructor.metadata.embedded?.Advancement;
  }

  /* -------------------------------------------------- */

  /**
   * Has this item granted other items via advancements?
   * @type {boolean}
   */
  get hasGrantedItems() {
    if (!this.supportsAdvancements) return false;
    for (const advancement of this.getEmbeddedPseudoDocumentCollection("Advancement").getByType("itemGrant")) {
      if (advancement.grantedItemsChain().size) return true;
    }
    return false;
  }

  /* -------------------------------------------------- */

  /**
   * An alternative to the document delete method, this deletes the item as well as any items that were
   * added as a result of this item's creation via advancements.
   * @returns {Promise<foundry.documents.Item[]|null>}   A promise that resolves to the deleted items.
   */
  async advancementDeletionPrompt() {
    if (!this.isEmbedded) {
      throw new Error("You cannot prompt for deletion of advancements of an unowned item.");
    }

    if (!this.supportsAdvancements) {
      throw new Error(`The [${this.type}] item type does not support advancements.`);
    }

    const itemIds = new Set([this.id]);
    for (const advancement of this.getEmbeddedPseudoDocumentCollection("Advancement").getByType("itemGrant")) {
      for (const item of advancement.grantedItemsChain()) itemIds.add(item.id);
    }

    const confirm = await ds.applications.api.DSDialog.confirm();
    if (!confirm) return;
    return this.actor.deleteEmbeddedDocuments("Item", Array.from(itemIds));
  }
}
