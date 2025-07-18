import BaseAdvancement from "./base-advancement.mjs";

/**
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 */

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * An advancement that applies changes to actor data during data prep.
 * @abstract
 */
export default class TraitAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      requirements: new SchemaField({
        level: new NumberField({ integer: true, min: 1, max: 10, nullable: false, initial: 1 }),
      }),
      chooseN: new NumberField({ required: true, integer: true, nullable: true, initial: null, min: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "trait";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.TRAIT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
  }

  /* -------------------------------------------------- */

  /**
   * Getter to indicate that this is a trait advancement.
   */
  get isTrait() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Options available for this specific Trait advancement, with values corresponding to the keys of a relevant record.
   * @type {FormSelectOption[]}
   * @abstract
   */
  get traitOptions() {
    throw new Error("A Trait Advancement must implement `get traitOptions`.");
  }

  /* -------------------------------------------------- */

  /**
   * Does this trait have a choice to make? This can be done synchronously unlike
   * for item grant advancements, so we can make use of a getter directly on the advancement here.
   * @type {boolean}
   */
  get isChoice() {
    if (this.chooseN === null) return false;
    if (this.chooseN < this.traitOptions.length) return true;
    return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
    /** @type {FormSelectOption[]} */
    const traits = node ? node.advancement.traitOptions : this.traitOptions;

    if (!traits.length) {
      throw new Error(`The trait advancement [${this.uuid}] has no available options configured.`);
    }

    const chooseN = this.isChoice ? this.chooseN : null;

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (!this.isChoice) return { [path]: traits.map(trait => trait.id) };

    const content = document.createElement("div");

    const item = this.document;
    const chosen = node
      ? Object.entries(node.selected).reduce((arr, [k, v]) => arr.concat(v ? k : []), [])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];

    const choiceSelect = foundry.applications.fields.createMultiSelectInput({ options: traits, name: "choices", type: "checkboxes", value: chosen });

    const formGroup = foundry.applications.fields.createFormGroup({
      classes: ["stacked"],
      input: choiceSelect,
      label: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseN", { n: chooseN }),
    });

    content.append(formGroup);

    /**
     * Render callback for Dialog.
     * @param {Event} event
     * @param {DSDialog} dialog
     */
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

    if (node) {
      node.selected = traitChoices.reduce((obj, choice) => { obj[choice] = true; return obj; }, {});
    }

    return { [path]: traitChoices.filter(_ => _) };
  }
}
