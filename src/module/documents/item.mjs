import { systemID, systemPath } from "../constants.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

/**
 * @import {ActiveEffectData} from "@common/documents/_types.mjs";
 */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Item.documentClass.
 */
export default class DrawSteelItem extends BaseDocumentMixin(foundry.documents.Item) {
  /** @inheritdoc */
  static migrateData(data) {
    // 0.8 type migrations
    if (data.type === "equipment") {
      data.type = "treasure";
      foundry.utils.setProperty(data, "flags.draw-steel.migrateType", true);
    }
    if (foundry.utils.getProperty(data, "system.type.value") === "perk") {
      data.type = "perk";
      foundry.utils.setProperty(data, "system.perkType", data.system.type.subtype);
      foundry.utils.setProperty(data, "flags.draw-steel.migrateType", true);
    }
    if (foundry.utils.getProperty(data, "system.type.value") === "title") {
      data.type = "title";
      foundry.utils.setProperty(data, "system.echelon", data.system.type.subtype);
      foundry.utils.setProperty(data, "flags.draw-steel.migrateType", true);
    }
    return super.migrateData(data);
  }

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
    return !!this.pseudoCollections?.Advancement;
  }

  /* -------------------------------------------------- */

  /**
   * Has this item granted other items via advancements?
   * @type {boolean}
   */
  get hasGrantedItems() {
    if (!this.supportsAdvancements || !this.parent) return false;
    return this.collection.some(item => {
      if (item.getFlag(systemID, "advancement.parentId") === this.id)
        return !!this.getEmbeddedCollection("Advancement").get(item.getFlag(systemID, "advancement.advancementId"));
      return false;
    });
  }

  /* -------------------------------------------------- */

  /**
   * An alternative to the document delete method, this deletes the item as well as any items that were
   * added as a result of this item's creation via advancements.
   * @param {Object} options
   * @param {boolean} [options.replacement=false]   Should the window title indicate that this is a replacement?
   * @param {boolean} [options.skipDialog=false]    Whether to skip the confirmation dialog, e.g., if there's already been another.
   * @returns {Promise<foundry.documents.Item[]|null>}   A promise that resolves to the deleted items.
   */
  async advancementDeletionPrompt({ replacement = false, skipDialog = false } = {}) {
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
    for (const advancement of this.getEmbeddedCollection("Advancement").documentsByType.itemGrant) {
      for (const item of advancement.grantedItemsChain()) {
        content.append(item.toAnchor());
        itemIds.add(item.id);
      }
    }

    if (!skipDialog) {
      const title = game.i18n.format(
        replacement ? "DRAW_STEEL.ADVANCEMENT.DeleteDialog.ReplaceTitle" : "DOCUMENT.Delete",
        { type: this.name },
      );
      const confirm = await ds.applications.api.DSDialog.confirm({
        content,
        window: {
          title,
          icon: "fa-solid fa-trash",
        },
      });
      if (!confirm) return;
    }

    return this.actor.deleteEmbeddedDocuments("Item", Array.from(itemIds));
  }
}
