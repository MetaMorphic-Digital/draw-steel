import { systemPath } from "../../constants.mjs";
import DSApplication from "../api/application.mjs";

/**
 * Prompt application for configuring the actor UUID that is causing a targeted condition
 */
export default class TargetedConditionPrompt extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["targeted-condition-prompt"],
    context: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/sheets/active-effect/targeted-condition-prompt.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {
      ...this.options.context,
      target: this.#target,
      condition: this.condition,
    };
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * The first target in the user targets
   * @type {Token}
   */
  #target = game.user.targets.first();

  /* -------------------------------------------------- */

  /**
   * The hook ID for canceling the hook on close
   * @type {number}
   */
  #hook;

  /* -------------------------------------------------- */

  /**
   * The condition label for the statusId.
   * @type {string}
   */
  get condition() {
    return CONFIG.statusEffects.find(condition => condition.id === this.options.context.statusId)?.name ?? "";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.ActiveEffect.TargetedConditionPrompt.Title", {
      condition: this.condition,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onFirstRender(context, options) {
    this.#hook = Hooks.on("targetToken", (user, token, active) => {
      if (!active) return;
      this.#target = token;
      this.render();
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(options) {
    Hooks.off("targetToken", this.#hook);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    return this.#target?.actor?.uuid;
  }
}
