import DSApplication from "./application.mjs";
import { systemPath } from "../../constants.mjs";

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
      setMessageMode: this.#setMessageMode,
    },
    context: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    footer: {
      template: systemPath("templates/api/roll-dialog-footer.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options.context ??= {};
    options.context.messageMode = game.settings.get("core", "messageMode");
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

    if (partId === "footer") context.messageModes = CONFIG.ChatMessage.modes;

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Change and store the picked roll mode.
   * @this RollDialog
   * @param {PointerEvent} event    The originating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static #setMessageMode(event, target) {
    this.options.context.messageMode = target.dataset.messageMode;
    this.render({ parts: ["footer"] });
  }
}
