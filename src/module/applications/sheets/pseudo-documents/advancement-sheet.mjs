import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";
import ItemGrantAdvancement from "../../../data/pseudo-documents/advancements/item-grant-advancement.mjs";

/**
 * @import BaseAdvancement from "../../../data/pseudo-documents/advancements/base-advancement.mjs".
 */

const { DragDrop, TextEditor } = foundry.applications.ux;

/**
 * A sheet representing advancements.
 * @extends PseudoDocumentSheet<BaseAdvancement>
 */
export default class AdvancementSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      deletePoolItem: AdvancementSheet.#deletePoolItem,
    },
    classes: ["advancement"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: "systems/draw-steel/templates/sheets/pseudo-documents/advancement/identity.hbs",
      classes: ["tab", "standard-form"],
    },
    details: {
      template: "systems/draw-steel/templates/sheets/pseudo-documents/advancement/details.hbs",
      classes: ["tab", "standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "identity":
        return this.#prepareIdentityContext(context);
      case "details":
        return this.#prepareDetailsContext(context);
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the identity tab.
   * @param {object} context        Rendering context.
   * @returns {Promise<object>}     Mutated rendering context.
   */
  async #prepareIdentityContext(context) {
    const ctx = context.ctx = {};
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the details tab.
   * @param {object} context        Rendering context.
   * @returns {Promise<object>}     Mutated rendering context.
   */
  async #prepareDetailsContext(context) {
    const ctx = context.ctx = {};

    if (context.document.type === "itemGrant") {
      ctx.itemPool = [];
      for (const [i, pool] of context.document.pool.entries()) {
        const item = await fromUuid(pool.uuid);
        ctx.itemPool.push({
          ...pool,
          index: i,
          link: item ? item.toAnchor() : game.i18n.localize("DRAW_STEEL.ADVANCEMENT.SHEET.unknownItem"),
        });
      }

      // Drop logic
      ctx.additionalTypes = Object.entries(ItemGrantAdvancement.ADDITIONAL_TYPES).map(([value, { label }]) => ({ value, label }));
      switch (context.document.additional.type) {
        case "perk":
          ctx.perkTypes = ds.CONFIG.perks.typeOptions;
          break;
      }
    }

    else if (context.document.type === "skill") {
      ctx.skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, { label }]) => ({ value, label }));
      for (const group of this.pseudoDocument.skills.groups) {
        if (!(skill in ds.CONFIG.skills.groups)) ctx.skillGroups.push({ value: group });
      }

      ctx.skillChoices = ds.CONFIG.skills.optgroups;
      for (const skill of this.pseudoDocument.skills.choices) {
        if (!(skill in ds.CONFIG.skills.list)) ctx.skillChoices.push({ value: skill });
      }
    }

    else if (context.document.type === "language") {
      ctx.languageChoices = Object.entries(ds.CONFIG.languages).map(([value, { label }]) => ({ value, label }));
      for (const language of this.pseudoDocument.languages) {
        if (!(language in ds.CONFIG.languages)) ctx.languageChoices.push({ value: language });
      }
    }

    else if (context.document.type === "characteristic") {
      ctx.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    new DragDrop.implementation({
      dropSelector: ".drop-target-area",
      callbacks: {
        drop: AdvancementSheet.#onDropTargetArea.bind(this),
      },
    }).bind(this.element);
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Handle drop events in the pool area.
   * @this {AdvancementSheet}
   * @param {DragEvent} event   The initiating drag event.
   */
  static async #onDropTargetArea(event) {
    const item = await fromUuid(TextEditor.implementation.getDragEventData(event).uuid);

    if (!item || (item.documentName !== "Item")) return;
    const subclassException = (item.type === "subclass") && (this.pseudoDocument.document.type === "class");
    if (!ItemGrantAdvancement.ALLOWED_TYPES.has(item.type) && !subclassException) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.restrictedType", {
      format: { type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]) },
    });
    if (!item.pack) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.requirePack", { localize: true });
    if (item.parent) return void ui.notifications.error("DRAW_STEEL.ADVANCEMENT.WARNING.forbidParent", { localize: true });

    const exists = this.pseudoDocument.pool.some(k => k.uuid === item.uuid);
    if (exists) return;

    const pool = foundry.utils.deepClone(this.pseudoDocument._source.pool);
    pool.push({ uuid: item.uuid, optional: !!pool.length && pool.every(p => p.optional) });
    this.pseudoDocument.update({ pool });
  }

  /* -------------------------------------------------- */

  /**
   * Delete an entry from the pool.
   * @this {AdvancementSheet}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #deletePoolItem(event, target) {
    const index = Number(target.closest("[data-pool-index]").dataset.poolIndex);
    const pool = foundry.utils.deepClone(this.pseudoDocument._source.pool);
    pool.splice(index, 1);
    this.pseudoDocument.update({ pool });
  }
}
