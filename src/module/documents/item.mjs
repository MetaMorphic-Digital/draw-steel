import BaseDocumentMixin from "./base-document-mixin.mjs";

// Necessary for continued type functionality with mixin
/** @import Item from "@client/documents/item.mjs"; */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Item.documentClass
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

  /**
   * Return an item's Draw Steel ID
   * @type {string}
   */
  get dsid() {
    if (this.system._dsid) return this.system._dsid;
    const dsid = this.name.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
    return dsid.slugify({ strict: true });
  }
}
