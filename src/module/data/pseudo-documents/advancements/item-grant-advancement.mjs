import BaseAdvancement from "./base-advancement.mjs";
import { systemID } from "../../../constants.mjs";
import { setOptions } from "../../helpers.mjs";
import ItemGrantConfigurationDialog from "../../../applications/apps/advancement/item-grant-configuration-dialog.mjs";
import AdvancementLeaf from "../../../utils/advancement/leaf.mjs";
import AdvancementChain from "../../../utils/advancement/chain.mjs";
import { advancement } from "../../../applications/apps/_module.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../../documents/_module.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * An advancement representing a fixed or chosen item grant from a known set of items.
 */
export default class ItemGrantAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      pool: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ embedded: false, type: "Item" }),
      })),
      chooseN: new NumberField({ required: true, integer: true, min: 1 }),
      additional: new SchemaField({
        type: new StringField({ required: true }),
        perkType: new SetField(setOptions()),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "itemGrant";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.ITEM_GRANT");

  /* -------------------------------------------------- */

  /**
   * Item types that can be added to an Item Grant.
   * @type {Set<string>}
   */
  static ALLOWED_TYPES = new Set(["ability", "treasure", "feature", "kit", "project", "perk", "ancestryTrait"]);

  /* -------------------------------------------------- */

  /**
   * Allowed additional types, where a user can add an unknown document to the advancement chain.
   * @type {Record<string, { label: string, points?: boolean }>}
   */
  static ADDITIONAL_TYPES = {
    ancestryTrait: {
      label: "TYPES.Item.ancestryTrait",
      points: true,
    },
    kit: {
      label: "TYPES.Item.kit",
    },
    perk: {
      label: "TYPES.Item.perk",
    },
    subclass: {
      label: "TYPES.Item.subclass",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    if (this.additional.type) return true;
    if (this.chooseN === null) return false;
    if (this.chooseN >= Object.values(this.pool).length) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get canReconfigure() {
    const actor = this.document.parent;
    // Removed check for isChoice, as an item grant advancement can always be reconfigured
    // to delete old versions of items and make new ones
    return !!actor && (this.requirements.level <= actor.system.level);
  }

  /* -------------------------------------------------- */

  /**
   * Does this item grant advancement use point buy rather than a simple count.
   * @type {boolean}
   */
  get pointBuy() {
    return !!this.constructor.ADDITIONAL_TYPES[this.additional.type]?.points;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
    // Item grants that are only granting a single item should have a matching icon
    const hasDefaultImage = (this.img === ds.CONFIG.Advancement.itemGrant.defaultImage);
    const hasOneGrant = (this.pool.length === 1);
    if (hasDefaultImage & hasOneGrant) {
      const indexEntry = fromUuidSync(this.pool[0].uuid);
      if (indexEntry) this.img = indexEntry.img;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Recursive method to find all items that were added to an actor by this advancement.
   * If the item is unowned, this returns `null`.
   * @returns {Set<foundry.documents.Item> | null}
   */
  grantedItemsChain() {
    if (!this.document.parent) return null;
    const items = new Set();
    // There is probably a more efficient function that uses less recursion
    // but it is unlikely that even deleting a level 10 class will have a noticeable performance cost.
    for (const item of this.document.collection) {
      const advancementFlags = item.getFlag(systemID, "advancement");
      if ((advancementFlags?.advancementId === this.id) && (advancementFlags.parentId === this.document.id)) {
        items.add(item);
        if (item.hasGrantedItems) {
          for (const advancement of item.getEmbeddedCollection("Advancement")) {
            for (const a of advancement.grantedItemsChain?.() ?? []) items.add(a);
          }
        }
      }

    }
    return items;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async createLeaves(node) {
    const promises = [];
    for (const { uuid } of this.pool) {
      // TODO: Optimize DB calls
      /** @type {DrawSteelItem} */
      const item = await fromUuid(uuid);
      if (!item) continue;
      const leaf = node.choices[item.uuid] = new AdvancementLeaf(node, item.uuid, item.toAnchor().outerHTML, { item });
      if (!item.supportsAdvancements) continue;

      promises.push(...node.chain.createNodes(item, { parentLeaf: leaf }));
    }
    return Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node) {
    const selection = await ItemGrantConfigurationDialog.create({ node });

    if (!selection) return null;

    if (node) {
      node.selected = selection.choices.reduce((selected, uuid) => {
        selected[uuid] = this.pointBuy ? node.choices[uuid].item.system.points : true;
        return selected;
      }, {});
    }

    return { [`flags.draw-steel.advancement.${this.id}.selected`]: selection.choices };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    /** @type {DrawSteelActor} */
    const actor = this.document.parent;

    const allowed = await ds.applications.api.DSDialog.confirm({
      window: {
        icon: "fa-solid fa-arrow-rotate-right",
        title: "DRAW_STEEL.ADVANCEMENT.Reconfigure.ConfirmItemGrant.Title",
      },
      content: `<p>${game.i18n.localize("DRAW_STEEL.ADVANCEMENT.Reconfigure.ConfirmItemGrant.Content")}</p>`,
    });
    if (!allowed) return;

    const chain = new AdvancementChain(actor, { start: null, end: actor.system.level });

    await chain.initializeRoots({ advancement: this });

    const configuration = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chain,
      window: { title: "DRAW_STEEL.ADVANCEMENT.ChainConfiguration.reconfigureTitle" },
    });
    if (!configuration) return;

    const toDelete = this.grantedItemsChain().map(i => i.id);
    if (toDelete.size) await actor.deleteEmbeddedDocuments("Item", Array.from(toDelete));

    const toUpdate = {
      [this.document.id]: { _id: this.document.id },
    };

    await actor.system._finalizeAdvancements({ chain, toUpdate });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(options) {
    const ctx = {};

    ctx.itemPool = [];
    for (const [i, pool] of this.pool.entries()) {
      const item = await fromUuid(pool.uuid);
      ctx.itemPool.push({
        ...pool,
        index: i,
        link: item ? item.toAnchor() : game.i18n.localize("DRAW_STEEL.ADVANCEMENT.SHEET.unknownItem"),
      });
    }

    // Drop logic
    ctx.additionalTypes = Object.entries(ItemGrantAdvancement.ADDITIONAL_TYPES).map(([value, { label }]) => ({ value, label }));
    switch (this.additional.type) {
      case "perk":
        ctx.perkTypes = ds.CONFIG.perks.typeOptions;
        break;
    }

    return ctx;
  }
}
