import AdvancementChain from "../../../utils/advancement-chain.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";

const {
  FilePathField, NumberField, SchemaField, StringField,
} = foundry.data.fields;

export default class BaseAdvancement extends TypedPseudoDocument {
  /** @type {import("../../../_types").PseudoDocumentMetadata} */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "Advancement",
      embedded: {},
      sheetClass: ds.applications.sheets.pseudoDocuments.AdvancementSheet,
      types: ds.data.pseudoDocuments.advancements,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      name: new StringField({ required: true }),
      img: new FilePathField({ categories: ["IMAGE"], initial: this.metadata.defaultImage || null, nullable: true }),
      requirements: new SchemaField({
        // The level requirement for this advancement
        level: new NumberField({ integer: true, min: 1, nullable: false, initial: 1 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.ADVANCEMENT"];

  /* -------------------------------------------------- */

  /**
   * Determine inheritance chain for item granting.
   * @param {AdvancementChain|null} [parent=null]   The 'parent' link in the chain.
   * @param {number} [_depth=0]                     Current tree level.
   * @returns {AdvancementChain}
   */
  async determineChain(parent = null, _depth = 0) {
    const leaf = new ds.utils.AdvancementChain({
      advancement: this,
      children: {},
      parent,
      pool: [],
      root: _depth === 0,
    });

    if (this.type === "itemGrant") {
      for (const { uuid, ...rest } of this.pool ?? []) {
        const item = await fromUuid(uuid);
        if (!item) continue;
        leaf.pool.push({ item, selected: !rest.optional, ...rest });

        if (!item.supportsAdvancements) continue;
        for (const advancement of item.getEmbeddedPseudoDocumentCollection("Advancement")) {
          leaf.children[advancement.id] = await advancement.determineChain(leaf, _depth + 1);
        }
      }
    }

    return leaf;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve all items from a set of roots. Use case???
   * @param {AdvancementChain[]} [roots=[]]   The roots of the advancement.
   * @returns {foundry.documents.Item[]}      Possible granted items.
   */
  static retrieveItemsFromChain(roots = []) {
    const items = [];
    for (const root of roots)
      for (const node of root.active())
        for (const { item, selected } of node.pool)
          if (selected !== false) items.push(item);
    return items;
  }

  /* -------------------------------------------------- */

  /**
   * Find all items on an actor that were granted by this specific advancement.
   * @returns {foundry.documents.Item[]|null}
   */
  grantedItems() {
    const item = this.document;
    if (!item.isEmbedded) return null;

    return item.collection.filter(i => {
      if (i === item) return false;
      const { advancementId, itemId } = i.getFlag("draw-steel", "advancement") ?? {};
      return (itemId === item.id) && (advancementId === this.id);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Find all items on an actor that would be removed were this advancement undone (e.g. the item deleted).
   * @returns {Set<foundry.documents.Item>}   An set of to-be-deleted items.
   */
  grantedItemsChain() {
    const items = this.grantedItems();
    for (const item of [...items]) {
      if (!item.supportsAdvancements) continue;
      for (const advancement of item.getEmbeddedPseudoDocumentCollection("Advancement").getByType("itemGrant")) {
        items.push(...advancement.grantedItemsChain());
      }
    }
    return new Set(items);
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve all advancements in a chain.
   * @param {AdvancementChain[]} [roots=[]]   The roots of the advancement.
   * @returns {(typeof BaseAdvancement)[]}
   */
  static retrieveAdvancementsFromChain(roots = []) {
    const items = [];
    for (const root of roots)
      for (const node of root.active())
        items.push(node.advancement);
    return items;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve items and construct data to be created on an actor. The data is prepared in such a way that
   * the items should be created with `keepId: true`.
   * @param {foundry.documents.Actor} actor   The actor on which to create the items.
   * @param {foundry.documents.Item} item     The root item. If a path item, this is not created.
   * @param {AdvancementChain[]} [roots=[]]   The fully configured advancement chains.
   * @returns {Promise<object[]>}             A promise that resolves to the prepared item data and other updates.
   */
  static async constructUpdates(actor, item, roots = []) {
    // Mapping of items' original id to the current item data. Used to find and set `itemId`.
    const items = new foundry.utils.Collection();
    let actorUpdate = {};

    // The item being prepared and the advancement that granted it.
    const prepareItem = (item, advancement = null) => {
      const data = game.items.fromCompendium(item, { keepId: true });
      if (actor.items.has(data._id)) data._id = foundry.utils.randomID();

      // `stored` does not exist for the "root" item.
      const stored = items.get(advancement?.document.id);
      if (stored) {
        foundry.utils.mergeObject(data, {
          "flags.draw-steel.advancement": { advancementId: advancement.id, itemId: stored._id },
        });
      }
      items.set(item.id, data);
    };

    // The root item itself is created as well.
    prepareItem(item, null);

    // Traverse the chains to gather all items.
    for (const root of roots)
      for (const node of root.active())
        for (const { item, selected } of node.pool)
          if (selected) prepareItem(item, node.advancement);

    const itemData = Array.from(items.values());

    return { actorUpdate, itemData };
  }

  /* -------------------------------------------------- */

  static async performChanges(actor, item) {
    const collection = item.getEmbeddedPseudoDocumentCollection("Advancement");
    if (!collection.size) return null;

    const chains = await Promise.all(collection.map(advancement => advancement.determineChain()));

    // TODO: pop UI to configure the chains here

    const { itemData, actorUpdate } = await BaseAdvancement.constructUpdates(actor, item, chains);

    return Promise.all([
      foundry.utils.isEmpty(itemData) ? null : actor.createEmbeddedDocuments("Item", itemData, { keepId: true }),
      foundry.utils.isEmpty(actorUpdate) ? null : actor.update(actorUpdate),
    ]);
  }
}
