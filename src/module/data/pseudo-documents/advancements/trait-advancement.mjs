import BaseAdvancement from "./base-advancement.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * An advancement that applies changes to actor data during data prep
 */
export default class TraitAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      embedded: {
        TraitChoice: "traits",
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      requirements: new SchemaField({
        level: new NumberField({ integer: true, min: 1, max: 10, nullable: false, initial: 1 }),
      }),
      traits: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.traitChoices.BaseTraitChoice),
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
    if (this.chooseN < this.traits.size) return true;
    return this.traits.some(t => t.isGroup);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
    /** @type {this["traits"]} */
    const traits = node ? node.advancement.traits : this.traits;

    if (!traits.size) {
      throw new Error(`The trait advancement [${this.uuid}] has no available choices configured.`);
    }

    const chooseN = this.isChoice ? null : this.chooseN;

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (!this.isChoice) return { [path]: traits.map(trait => trait.id) };

    const item = this.document;
    const chosen = node
      ? traits.filter(trait => node.selected[trait.id])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];

    const content = document.createElement("div");

    /** @type {Set<string>} */
    const traitTypes = new Set();
    const allOptions = {};
    const options = [];
    for (const trait of traits) {
      // if (!traitTypes.has(trait.type)) {
      //   allOptions.push(...trait.traitChoices);
      //   traitTypes.add(trait.type);
      // }

      // if (trait.isGroup) options.push(...trait.choicesForGroup(trait.options));
      // else options.

      const fgroup = foundry.applications.fields.createFormGroup({
        label: trait.name,
        input: foundry.utils.parseHTML(`<input type="checkbox" value="${trait.id}" name="choices" ${chosen.includes(trait.id) ? "checked" : ""}>`),
      });
      content.append(fgroup);
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
      content: content,
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
