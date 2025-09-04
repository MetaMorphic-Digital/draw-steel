import BaseAdvancement from "./base-advancement.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { systemID } from "../../../constants.mjs";
import { setOptions } from "../../helpers.mjs";
import ItemGrantConfigurationDialog from "../../../applications/apps/advancement/item-grant-configuration-dialog.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
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
      chooseN: new NumberField({ required: true, integer: true, nullable: true, initial: null, min: 1 }),
      expansion: new SchemaField({
        type: new StringField({ blank: false }),
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
  static ALLOWED_TYPES = new Set(["ability", "treasure", "feature", "kit", "project"]);

  /* -------------------------------------------------- */

  /**
   * Allowed expansion types, where a user can add an unknown document to the advancement chain.
   * @type {Record<string, { label: string }>}
   */
  static EXPANSION_TYPES = {
    perk: {
      label: "TYPES.Item.perk",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    if (this.expansion.type) return true;
    if (this.chooseN === null) return false;
    if (this.chooseN >= Object.values(this.pool).length) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
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
          for (const advancement of item.getEmbeddedPseudoDocumentCollection("Advancement")) {
            for (const a of advancement.grantedItemsChain?.() ?? []) items.add(a);
          }
        }
      }

    }
    return items;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
    const selection = await ItemGrantConfigurationDialog.create({ node, advancement: this });

    if (!selection) return null;

    const uuids = Array.isArray(selection.choices) ? selection.choices : [selection.choices];

    return { [`flags.draw-steel.advancement.${this.id}.selected`]: uuids.filter(_ => _) };
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

    const chains = [await ds.utils.AdvancementChain.create(this, null, { end: actor.system.level })];
    const configuration = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chains, actor, window: { title: "DRAW_STEEL.ADVANCEMENT.ChainConfiguration.reconfigureTitle" },
    });
    if (!configuration) return;

    const toDelete = this.grantedItemsChain().map(i => i.id);
    if (toDelete.size) await actor.deleteEmbeddedDocuments("Item", Array.from(toDelete));

    const toUpdate = {
      [this.document.id]: { _id: this.document.id },
    };

    await actor.system._finalizeAdvancements({ chains, toUpdate });
  }
}
