import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

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
    }

    else if (context.document.type === "skill") {
      ctx.skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, { label }]) => ({ value, label }));
      ctx.skillChoices = ds.CONFIG.skills.optgroups;
    }

    else if (context.document.type === "language") {
      ctx.languageChoices = Object.entries(ds.CONFIG.languages).map(([value, { label }]) => ({ value, label }));
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    new foundry.applications.ux.DragDrop.implementation({
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
   * @param {DragEvent} event   The initiating drag event.
   */
  static async #onDropTargetArea(event) {
    const item = await fromUuid(foundry.applications.ux.TextEditor.implementation.getDragEventData(event).uuid);

    // TODO: Restrict by item type.
    if (!item || (item.documentName !== "Item")) return;

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
