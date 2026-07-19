import ItemGrantAdvancement from "../../../data/pseudo-documents/advancements/item-grant-advancement.mjs";
import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

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
      deletePoolActor: AdvancementSheet.#deletePoolDocument,
      deletePoolEffect: AdvancementSheet.#deletePoolDocument,
      deletePoolItem: AdvancementSheet.#deletePoolDocument,
    },
    classes: ["advancement"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
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
        return this.#prepareDetailsContext(context, options);
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
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the details tab.
   * @param {object} context    Rendering context.
   * @returns {Promise<object>}     Mutated rendering context.
   */
  async #prepareDetailsContext(context, options) {

    context.ctx = await this.pseudoDocument.getSheetContext(options);

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#dragDrop.bind(this.element);
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * A reusable DragDrop instance.
   * @type {DragDrop}
   */
  #dragDrop = new DragDrop.implementation({
    dropSelector: ".drop-target-area",
    callbacks: {
      drop: AdvancementSheet.#onDropTargetArea.bind(this),
    },
  });

  /**
   * Handle drop events in the pool area.
   * @this {AdvancementSheet}
   * @param {DragEvent} event   The initiating drag event.
   */
  static async #onDropTargetArea(event) {
    const document = await fromUuid(TextEditor.implementation.getDragEventData(event).uuid);

    if (!document || (typeof this.pseudoDocument.handleDrop !== "function")) return;

    return this.pseudoDocument.handleDrop(document);
  }

  /* -------------------------------------------------- */

  /**
   * Delete an entry from the pool.
   * @this {AdvancementSheet}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #deletePoolDocument(event, target) {
    const index = Number(target.closest("[data-pool-index]").dataset.poolIndex);
    const pool = foundry.utils.deepClone(this.pseudoDocument._source.pool);
    pool.splice(index, 1);
    this.pseudoDocument.update({ pool });
  }
}
