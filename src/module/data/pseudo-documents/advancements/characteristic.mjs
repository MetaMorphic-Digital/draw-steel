import { setOptions } from "../../helpers.mjs";
import BaseAdvancement from "./base-advancement.mjs";

/**
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 */

const { NumberField, SchemaField, SetField } = foundry.data.fields;

/**
 * An advancement that applies a permanent adjustment to an actor's characteristics.
 * @abstract
 */
export default class CharacteristicAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      guaranteed: new SetField(setOptions()),
      choices: new SetField(setOptions()),
      max: new NumberField({ required: true, integer: true, initial: 2 }),
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

  /** @inheritdoc */
  get isChoice() {
    return this.choices.size;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {

    const increases = Array.from(this.guaranteed);

    const path = `flags.draw-steel.advancement.${this.id}.selected`;
    if (!this.isChoice) return { [path]: increases };

    if (node) {
      node.selected = increases;
    }

    return { [path]: increases };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    const configuration = await this.configureAdvancement();
    if (configuration) await this.document.update(configuration);
  }
}
