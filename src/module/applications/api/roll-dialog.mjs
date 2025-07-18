import { systemPath } from "../../constants.mjs";
import DSApplication from "./application.mjs";

/**
 * Provides basic framework for roll dialogs.
 * @abstract
 */
export default class RollDialog extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["roll-dialog"],
    window: {
      icon: "fa-solid fa-dice-d10",
    },
    actions: {
      setRollMode: this.#setRollMode,
    },
    context: null,
  };

  /* -------------------------------------------------- */

  static PARTS = {
    footer: {
      template: systemPath("templates/api/roll-dialog-footer.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options.context ??= {};
    options.context.rollMode = game.settings.get("core", "rollMode");
    return super._initializeApplicationOptions(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return { ...this.options.context };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "footer") context.rollModes = CONFIG.Dice.rollModes;

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Change and store the picked roll mode.
   * @this RollDialog
   * @param {PointerEvent} event    The originating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #setRollMode(event, target) {
    this.options.context.rollMode = target.dataset.rollMode;
    this.render({ parts: ["footer"] });
  }
}
