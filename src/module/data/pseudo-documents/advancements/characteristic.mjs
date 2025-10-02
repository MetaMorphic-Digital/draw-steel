import BaseAdvancement from "./base-advancement.mjs";

/**
 * @import { FormSelectOption } from "@client/applications/forms/fields.mjs";
 */

// const { NumberField } = foundry.data.fields;

/**
 * An advancement that applies a permanent adjustment to an actor's characteristics.
 * @abstract
 */
export default class CharacteristicAdvancement extends BaseAdvancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {

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
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async reconfigure() {
    await super.reconfigure();

    const configuration = await this.configureAdvancement();
    if (configuration) await this.document.update(configuration);
  }
}
