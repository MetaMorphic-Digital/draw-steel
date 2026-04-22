import { systemID, systemPath } from "../constants.mjs";
import BaseDocumentMixin from "./base-document-mixin.mjs";

/**
 * @import { DrawSteelActiveEffect } from "./_module.mjs";
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

  /* -------------------------------------------------- */

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

    if (typeof this.system.modifyRollData === "function") {
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
   * Generate a DSID from an item name.
   * @param {string} name A name.
   * @returns {string} A valid DSID.
   */
  static generateDSID(name) {
    return name.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3").slugify({ strict: true });
  }

  /* -------------------------------------------------- */

  /**
   * Return an item's Draw Steel ID.
   * @type {string}
   */
  get dsid() {
    if (this.system._dsid) return this.system._dsid;
    else return this.constructor.generateDSID(this.name);
  }

  /* -------------------------------------------------- */
  /*   Advancements                                     */
  /* -------------------------------------------------- */

  /**
   * Does this item type support advancements?
   * @type {boolean}
   */
  get supportsAdvancements() {
    return "Advancement" in this.pseudoCollections;
  }

  /* -------------------------------------------------- */

  /**
   * Has this item granted other documents via advancements?
   * @type {boolean}
   */
  get hasGrantedDocuments() {
    if (!this.supportsAdvancements || !this.parent) return false;
    return this.collection.some(item => {
      if (item.getFlag(systemID, "advancement.parentId") === this.id)
        return !!this.getEmbeddedCollection("Advancement").get(item.getFlag(systemID, "advancement.advancementId"));
      return false;
    }) || this.parent.effects.some(effect => {
      if (effect.getFlag(systemID, "advancement.parentId") === this.id)
        return !!this.getEmbeddedCollection("Advancement").get(effect.getFlag(systemID, "advancement.advancementId"));
      return false;
    });
  }

  /* -------------------------------------------------- */

  /** @deprecated */
  get hasGrantedItems() {
    foundry.utils.logCompatibilityWarning("DrawSteelItem#hasGrantedItems has been deprecated in favor of DrawSteelItem#hasGrantedDocuments", {
      since: 1.1, until: 1.3, once: true,
    });
    return this.hasGrantedDocuments;
  }

  /* -------------------------------------------------- */

  /**
   * Perform a roll with this item, failing gracefully if the item subtype does not support rolls.
   * @param {object} [config]         Configuration specific to this item's rolling operation.
   * @param {object} [dialogOptions]  Options to be forwarded to the roll dialog.
   * @param {object} [messageOptions] Options to be forwarded to the final created chat message.
   * @returns {Promise<DrawSteelChatMessage | null>} The created chat message,
   * or null if the roll operation was canceled or could not be completed.
   */
  async roll(config = {}, dialogOptions = {}, messageOptions = {}) {
    if (typeof this.system.roll === "function") return this.system.roll(config, dialogOptions, messageOptions);
    console.error(`Item ${this.name} of type ${this.type} cannot perform a roll`);
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * An alternative to the document delete method, this deletes the item as well as any documents that were
   * added as a result of this item's creation via advancements.
   * @param {object} options
   * @param {boolean} [options.replacement=false]   Should the window title indicate that this is a replacement?
   * @param {boolean} [options.skipDialog=false]    Whether to skip the confirmation dialog, e.g., if there's already been another.
   * @returns {Promise<[DrawSteelItem, DrawSteelActiveEffect]|null>}   A promise that resolves to the deleted items.
   */
  async advancementDeletionPrompt({ replacement = false, skipDialog = false } = {}) {
    if (!this.isEmbedded) {
      throw new Error("You cannot prompt for deletion of advancements of an unowned item.");
    }

    if (!this.supportsAdvancements) {
      throw new Error(`The [${this.type}] item type does not support advancements.`);
    }

    const content = document.createElement("div");

    content.insertAdjacentHTML("afterbegin", `<p>${_loc("DRAW_STEEL.ADVANCEMENT.DeleteDialog.Content")}</p>`);
    content.append(this.toAnchor());

    const itemIds = new Set([this.id]);
    const effectIds = new Set();
    const advancementCollection = this.getEmbeddedCollection("Advancement");
    for (const advancement of advancementCollection.documentsByType.itemGrant) {
      const [items, effects] = advancement.grantedDocumentsChain();
      for (const i of items ?? []) {
        content.append(i.toAnchor());
        itemIds.add(i.id);
      }
      for (const e of effects ?? []) {
        content.append(e.toAnchor());
        effectIds.add(e.id);
      }
    }
    for (const advancement of advancementCollection.documentsByType.effectGrant) {
      const effects = advancement.grantedEffects();
      for (const e of effects ?? []) {
        content.append(e.toAnchor());
        effectIds.add(e.id);
      }
    }

    if (!skipDialog) {
      const title = _loc(
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

    return foundry.documents.modifyBatch([{
      action: "delete",
      documentName: "Item",
      ids: Array.from(itemIds),
      pack: this.actor.pack,
      parent: this.actor,
    }, {
      action: "delete",
      documentName: "ActiveEffect",
      ids: Array.from(effectIds),
      pack: this.actor.pack,
      parent: this.actor,
    }]);
  }
}
