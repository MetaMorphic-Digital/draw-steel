import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

export default class AdvancementSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      deletePoolItem: AdvancementSheet.#deletePoolItem,
      addTrait: AdvancementSheet.#addTrait,
      deleteTrait: AdvancementSheet.#deleteTrait,
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
    context.ctx = {};
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the details tab.
   * @param {object} context        Rendering context.
   * @returns {Promise<object>}     Mutated rendering context.
   */
  async #prepareDetailsContext(context) {
    const ctx = context.ctx = { itemPool: [], traits: [] };

    if (context.document.type === "itemGrant") {
      for (const [i, pool] of context.document.pool.entries()) {
        const item = await fromUuid(pool.uuid);
        ctx.itemPool.push({
          ...pool,
          index: i,
          link: item ? item.toAnchor() : game.i18n.localize("DRAW_STEEL.ADVANCEMENT.SHEET.unknownItem"),
        });
      }
    }

    else if (context.document.type === "trait") {
      for (const [k, v] of Object.entries(context.document._source.traits)) {
        const namePrefix = `traits.${k}.`;
        ctx.traits.push({
          traitId: k,
          namePrefix,
          values: {
            label: v.label,
            value: v.value,
          },
          labelPlaceholder: ds.CONFIG.TRAITS[v.trait].label,
          traitField: ds.CONFIG.TRAITS[v.trait].field ?? context.fields.traits.element.fields.value,
        });
      }
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

  /* -------------------------------------------------- */

  /**
   * Add a new trait for a Trait advancement.
   * @this {AdvancementSheet}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #addTrait(event, target) {
    const options = Object.entries(ds.CONFIG.TRAITS).map(([k, v]) => {
      return { value: k, label: v.label };
    });
    const input = foundry.applications.fields.createSelectInput({
      options,
      name: "trait",
    });
    const result = await ds.applications.api.DSDialog.input({
      content: input.outerHTML,
    });
    if (result) this.pseudoDocument.update({
      [`traits.${foundry.utils.randomID()}.trait`]: result.trait,
    });
  }

  /* -------------------------------------------------- */

  /**
   * Delete a trait off a Trait advancement.
   * @this {AdvancementSheet}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #deleteTrait(event, target) {
    const id = target.closest("[data-trait-id]").dataset.traitId;
    this.pseudoDocument.update({ [`traits.-=${id}`]: null });
  }
}
