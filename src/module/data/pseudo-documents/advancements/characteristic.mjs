import { systemID } from "../../../constants.mjs";
import BaseAdvancement from "./base-advancement.mjs";

const { NumberField, TypedObjectField } = foundry.data.fields;

/**
 * An advancement that applies a permanent adjustment to an actor's characteristics.
 * @abstract
 */
export default class CharacteristicAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      characteristics: new TypedObjectField(new NumberField({ choices: {
        0: "DRAW_STEEL.ADVANCEMENT.CHARACTERISTIC.Options.Choice",
        1: "DRAW_STEEL.ADVANCEMENT.CHARACTERISTIC.Options.Guaranteed",
        [-1]: "DRAW_STEEL.ADVANCEMENT.CHARACTERISTIC.Options.Never",
      } }), { initial: () => {
        return Object.keys(ds.CONFIG.characteristics).reduce((obj, key) => {
          obj[key] = -1;
          return obj;
        }, {});
      } }),
      max: new NumberField({ required: true, integer: true, initial: 3 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "characteristic";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.ADVANCEMENT.CHARACTERISTIC");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return [this.requirements.level];
  }

  /* -------------------------------------------------- */

  /**
   * Characteristics only ever choose up to 1 option.
   */
  get chooseN() {
    return Object.values(this.characteristics).reduce((selections, v) => {
      return selections + Math.max(0, v);
    }, 1);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    return Object.values(this.characteristics).some(v => v === 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {

    const increases = [];

    const characteristics = Object.entries(ds.CONFIG.characteristics).reduce((arr, [key, { label }]) => {
      switch (this.characteristics[key]) {
        case 0:
          arr.push({ value: key, label });
          break;
        case 1:
          increases.push(key);
          break;
      }
      return arr;
    }, []);

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (!this.isChoice) return { [path]: increases };

    const content = document.createElement("div");

    const choiceSelect = foundry.applications.fields.createSelectInput({
      options: characteristics,
      name: "choices",
      type: "checkboxes",
    });

    const formGroup = foundry.applications.fields.createFormGroup({
      input: choiceSelect,
      label: game.i18n.localize("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Characteristic.label"),
      hint: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Characteristic.hint", { n: this.max }),
    });

    content.append(formGroup);

    const selection = await ds.applications.api.DSDialog.input({
      content,
      classes: ["configure-advancement"],
      window: {
        title: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.name }),
        icon: "fa-solid fa-edit",
      },
    });

    if (!selection) return;

    increases.push(selection.choices);

    if (node) node.selected = increases.reduce((obj, choice) => { obj[choice] = true; return obj; }, {});

    return { [path]: increases };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    const configuration = await this.configureAdvancement();
    if (configuration) {
      const flagPath = `advancement.${this.id}.selected`;
      const previous = new Set(this.document.getFlag(systemID, flagPath) ?? []);
      const chosen = new Set(configuration[`flags.${systemID}.${flagPath}`]);
      const increases = chosen.difference(previous);
      const decreases = previous.difference(chosen);
      await this.document.update(configuration);

      const updateData = {};
      const actor = this.document.parent;

      for (const chr of increases) {
        const path = `system.characteristics.${chr}.value`;
        const currentValue = foundry.utils.getProperty(actor, path);
        foundry.utils.setProperty(updateData, path, currentValue + 1);
      }
      for (const chr of decreases) {
        const path = `system.characteristics.${chr}.value`;
        const currentValue = foundry.utils.getProperty(actor, path);
        foundry.utils.setProperty(updateData, path, currentValue - 1);
      }

      await actor.update(updateData);
    }
  }
}
