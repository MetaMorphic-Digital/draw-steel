import { systemPath } from "../constants.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Item.documentClass.
 */
export default class DrawSteelItem extends BaseDocumentMixin(foundry.documents.Item) {
  /** @inheritdoc */
  static async createDialog(data = {}, { pack, ...createOptions } = {}, { types, template, ...dialogOptions } = {}) {
    if (!pack) {
      types ??= this.TYPES;
      types = types.filter(t => !CONFIG.Item.dataModels[t].metadata?.packOnly);
      template = systemPath("templates/sidebar/tabs/item/document-create.hbs");
    }
    return super.createDialog(data, { pack, ...createOptions }, { types, template, ...dialogOptions });
  }

  /* -------------------------------------------------- */

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
   * Return an item's Draw Steel ID.
   * @type {string}
   */
  get dsid() {
    if (this.system._dsid) return this.system._dsid;
    const dsid = this.name.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
    return dsid.slugify({ strict: true });
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
      if (advancement.grantedItemsChain()?.size) return true;
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

    const content = document.createElement("div");

    content.insertAdjacentHTML("afterbegin", `<p>${game.i18n.localize("DRAW_STEEL.ADVANCEMENT.DeleteDialog.Content")}</p>`);
    content.append(this.toAnchor());

    const itemIds = new Set([this.id]);
    for (const advancement of this.getEmbeddedPseudoDocumentCollection("Advancement").getByType("itemGrant")) {
      for (const item of advancement.grantedItemsChain()) {
        content.append(item.toAnchor());
        itemIds.add(item.id);
      }
    }

    const confirm = await ds.applications.api.DSDialog.confirm({
      content,
      window: {
        icon: "fa-solid fa-trash",
        title: `${game.i18n.format("DOCUMENT.Delete", { type: this.name })}`,
      },
    });
    if (!confirm) return;
    return this.actor.deleteEmbeddedDocuments("Item", Array.from(itemIds));
  }
}
