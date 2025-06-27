import BaseAdvancement from "./base-advancement.mjs";

const { NumberField, SchemaField, StringField, TypedObjectField } = foundry.data.fields;

export default class TraitAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      requirements: new SchemaField({
        level: new NumberField({ integer: true, min: 1, max: 10, nullable: false, initial: 1 }),
      }),
      traits: new TypedObjectField(new SchemaField({
        label: new StringField({ required: true }),
        trait: new StringField({ required: true, blank: false, choices: () => ds.CONFIG.TRAITS }),
        value: new StringField({ required: true, blank: true }),
      }), { validateKey: key => foundry.data.validators.isValidId(key) }),
      // If `null`, then this is explicitly a "receive all" - but also if the number is equal to or greater than the pool
      chooseN: new NumberField({ integer: true, nullable: true, initial: null, min: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "trait";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "DRAW_STEEL.ADVANCEMENT.TRAIT",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
  }

  /* -------------------------------------------------- */

  /**
   * Does this trait have a choice to make? This can be done synchronously unlike
   * for item grant advancements, so we can make use of a getter directly on the advancement here.
   * @type {boolean}
   */
  get isChoice() {
    if (this.chooseN === null) return false;
    if (this.chooseN >= Object.keys(this.traits).length) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Set default labels for trait options.
    for (const k in this.traits) {
      if (!this.traits[k].label) {
        this.traits[k].label = ds.CONFIG.TRAITS[this.traits[k].trait].label;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
    const traits = Object.entries(node ? node.advancement.traits : this.traits)
      .filter(([k, v]) => v.trait in ds.CONFIG.TRAITS);

    if (!traits.length) {
      throw new Error(`The trait advancement [${this.uuid}] has no available choices configured.`);
    }

    const chooseN = (this.chooseN === null) || (this.chooseN >= traits.length) ? null : this.chooseN;

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (chooseN === null) return { [path]: traits.map(trait => trait[0]) };

    const item = this.document;
    const chosen = node
      ? traits.filter(([k]) => node.selected[k])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];

    const content = [];
    for (const [traitId, trait] of traits) {
      const fgroup = foundry.applications.fields.createFormGroup({
        label: trait.label,
        input: foundry.utils.parseHTML(`<input type="checkbox" value="${traitId}" name="choices" ${chosen.includes(traitId) ? "checked" : ""}>`),
      });
      content.push(fgroup);
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

    const selection = await ds.applications.api.DSDialog.input({
      render,
      content: content.map(fgroup => fgroup.outerHTML).join(""),
    });

    if (!selection) return null;
    const traitIds = Array.isArray(selection.choices) ? selection.choices : [selection.choices];

    if (node) {
      node.selected = {};
      for (const [traitId] of traits) node.selected[traitId] = selection.choices.includes(traitId);
    }

    return { [path]: traitIds.filter(_ => _) };
  }
}
