import BaseAdvancement from "./base-advancement.mjs";

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

/**
 * An advancement representing a fixed or chosen item grant from a known set of items
 */
export default class ItemGrantAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      requirements: new SchemaField({
        level: new NumberField({ min: 1, integer: true, max: 10, initial: 1, nullable: false }),
      }),
      pool: new ArrayField(new SchemaField({
        uuid: new DocumentUUIDField({ embedded: false, type: "Item" }),
      })),
      chooseN: new NumberField({ integer: true, nullable: true, initial: null, min: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "itemGrant";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "DRAW_STEEL.ADVANCEMENT.ITEM_GRANT",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
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

    const content = [];
    for (const item of items) {
      const fgroup = `
      <div class="form-group">
        <label>${item.toAnchor().outerHTML}</label>
        <div class="form-fields">
          <input type="checkbox" value="${item.uuid}" name="choices" ${chosen.includes(item.uuid) ? "checked" : ""}>
        </div>
      </div>`;
      content.push(foundry.utils.parseHTML(fgroup));
    }

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

    const _content = document.createElement("DIV");
    for (const fg of content) _content.insertAdjacentElement("beforeend", fg);
    const selection = await ds.applications.api.DSDialog.input({
      window: {
        title: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.name }),
        icon: "fa-solid fa-edit",
      },
      render,
      content: _content,
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
