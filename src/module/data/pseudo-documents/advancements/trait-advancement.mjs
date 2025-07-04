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

    const chooseN = this.isChoice ? this.chooseN : null;

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (!this.isChoice) return { [path]: traits.map(trait => trait.id) };

    const content = document.createElement("div");

    /** @type {Record<string, Record<string, { label: string; group?: string }>>} */
    const allOptions = {};
    /** @type {Record<string, string[]>} */
    const optionKeys = {};
    for (const trait of traits) {
      allOptions[trait.type] ??= trait.traitChoices;
      optionKeys[trait.type] ??= [];

      if (trait.isGroup) optionKeys[trait.type].push(...trait.choicesForGroup(trait.options));
      else optionKeys[trait.type].push(trait.options);
    }

    const options = Object.entries(optionKeys).flatMap(([traitType, keys]) => {
      return keys.map(k => ({ label: allOptions[traitType][k].label, value: k }));
    });

    const item = this.document;
    const chosen = node
      ? Object.entries(node.selected).reduce((arr, [k, v]) => { if (v) arr.push(k); return arr; }, [])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];

    const choiceSelect = foundry.applications.fields.createMultiSelectInput({ options, name: "choices", type: "checkboxes", value: chosen });

    content.append(choiceSelect);

    function render(event, dialog) {
      /** @type {foundry.applications.elements.HTMLMultiCheckboxElement} */
      const multiCheckbox = dialog.element.querySelector("multi-checkbox[name=choices]");
      const submit = dialog.element.querySelector(".form-footer [type=submit]");
      multiCheckbox.addEventListener("change", () => {
        for (const checkbox of multiCheckbox.querySelectorAll("input")) checkbox.disabled = !multiCheckbox.value.includes(checkbox.value) && (multiCheckbox.value.length >= chooseN);
        submit.disabled = multiCheckbox.value.length !== chooseN;
      });
      multiCheckbox.dispatchEvent(new Event("change"));
    }

    const selection = await ds.applications.api.DSDialog.input({
      window: {
        title: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.name }),
        icon: "fa-solid fa-edit",
      },
      render,
      content: content,
    });

    if (!selection) return null;
    /** @type {string[]} */
    const traitChoices = Array.isArray(selection.choices) ? selection.choices : [selection.choices];

    console.log(node, traitChoices);
    if (node) {
      node.selected = traitChoices.reduce((obj, choice) => { obj[choice] = true; return obj; }, {});
    }

    return { [path]: traitChoices.filter(_ => _) };
  }
}
