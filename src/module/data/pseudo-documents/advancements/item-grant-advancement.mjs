import BaseAdvancement from "./base-advancement.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { systemID } from "../../../constants.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

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

  /** @inheritdoc */
  get isChoice() {
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
    const items = node ?
      Object.values(node.choices).map(choice => choice.item)
      : (await Promise.all(this.pool.map(p => fromUuid(p.uuid)))).filter(_ => _);

    if (!items.length) {
      throw new Error(`The item grant advancement [${this.uuid}] has no available items configured.`);
    }

    const chooseN = (this.chooseN === null) || (this.chooseN >= items.length) ? null : this.chooseN;

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (chooseN === null) return { [path]: items.map(item => item.uuid) };

    const item = this.document;
    const chosen = node
      ? Object.entries(node.selected).filter(k => k[1]).map(k => k[0])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];

    const content = document.createElement("div");
    for (const item of items) {
      const fgroup = `
      <div class="form-group">
        <label>${item.toAnchor().outerHTML}</label>
        <div class="form-fields">
          <input type="checkbox" value="${item.uuid}" name="choices" ${chosen.includes(item.uuid) ? "checked" : ""}>
        </div>
      </div>`;
      content.insertAdjacentElement("beforeend", foundry.utils.parseHTML(fgroup));
    }

    /**
     * Render callback for Dialog.
     * @param {Event} event
     * @param {DSDialog} dialog
     */
    function render(event, dialog) {
      const checkboxes = dialog.element.querySelectorAll("input[name=choices]");
      const submit = dialog.element.querySelector(".form-footer [type=submit]");
      for (const checkbox of checkboxes) {
        checkbox.addEventListener("change", () => {
          const count = Array.from(checkboxes).reduce((acc, checkbox) => acc + checkbox.checked, 0);
          for (const checkbox of checkboxes) checkbox.disabled = !checkbox.checked && (count >= chooseN);
          submit.disabled = count !== chooseN;
        });
      }
      checkboxes[0].dispatchEvent(new Event("change"));
    }

    const selection = await DSDialog.input({
      content,
      render,
      classes: ["configure-advancement"],
      window: {
        title: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.name }),
        icon: "fa-solid fa-edit",
      },
    });

    if (!selection) return null;
    const uuids = Array.isArray(selection.choices) ? selection.choices : [selection.choices];

    if (node) {
      node.selected = {};
      for (const item of items) node.selected[item.uuid] = uuids.includes(item.uuid);
    }

    return { [path]: uuids.filter(_ => _) };
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
