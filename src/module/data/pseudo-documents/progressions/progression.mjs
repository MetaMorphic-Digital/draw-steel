import PseudoDocument from "../pseudo-document.mjs";

const { NumberField, StringField } = foundry.data.fields;

/**
 * A progression model is responsible for keeping track of the advancements that
 * modified the actor in any meaningful way, such as modifying attributes or
 * creating new items. This thus serves as the entry point to 'undo' an advancement.
 */
export default class Progression extends PseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "Progression",
      embedded: {},
      sheetClass: null, // TODO: Do we want a sheet for a progression?
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      // TODO: Implement schema that the progression holds for undoing more than item grants
    });
  }

  /* -------------------------------------------------- */

  /**
   * The items on the parent actor that were specifically created by the
   * addition of this progression (excluding grandchild items).
   * @type {foundry.documents.Item[]}
   */
  get items() {
    return this.document.items.filter(item => {
      const { progressionId } = item.getFlag("draw-steel", "advancement") ?? {};
      return progressionId === this.id;
    });
  }

  /* -------------------------------------------------- */

  getItemChain() {
    // Items directly granted by this progression.
    const items = this.document.items.filter(item => {
      const { progressionId } = item.getFlag("draw-steel", "advancement") ?? {};
      return progressionId === this.id;
    });

    // Add in all 'nested' items.
    for (const item of [...items]) {
      if (!item.supportsAdvancements) continue;
      for (const advancement of item.getEmbeddedPseudoDocumentCollection("Advancement").getByType("itemGrant")) {
        items.push(...advancement.grantedItemsChain());
      }
    }

    return items;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async delete(operation = {}) {
    if (!this.isSource) throw new Error("You cannot delete a non-source pseudo-document!");
    const confirm = await this.#confirmDeletion();
    if (!confirm) return;
    const result = await super.delete(operation);
    await this.#undoAdvancement();
    return result;
  }

  /* -------------------------------------------------- */

  async #confirmDeletion() {
    return ds.applications.api.DSDialog.confirm({ content: "Really undo progression?" });
  }

  /* -------------------------------------------------- */

  async #undoAdvancement() {
    // TODO: Undo more than just items.
    const itemIds = this.getItemChain().map(item => item.id);
    await this.document.deleteEmbeddedDocuments("Item", itemIds);
  }
}
