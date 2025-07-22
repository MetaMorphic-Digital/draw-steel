import BaseAdvancement from "./base-advancement.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";

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
   * Item types that cannot be added to an Item Grant.
   * @type {Set<string>}
   */
  static RESTRICTED_TYPES = new Set(["ancestry", "career", "class", "complication", "culture", "subclass"]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
  }

  /* -------------------------------------------------- */

  /**
   * Recursive method to find all items that were added to an actor by this advancement.
   * If the item is unowned, this returns `null`.
   * @returns {Set<foundry.documents.Item[]>|null}
   */
  grantedItemsChain() {
    // TODO
    return new Set();
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
}
