import { systemPath } from "../../constants.mjs";

/** @import { ApplicationConfiguration } from "../../../../foundry/client/applications/_types.mjs" */

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Prompt application for configuring the actor UUID that is causing a targeted condition
 */
export default class TargetedConditionPrompt extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "targeted-condition-prompt"],
    tag: "form",
    form: {
      closeOnSubmit: true,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/active-effect/targeted-condition-prompt.hbs"),
    },
  };

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {
      ...this.options.context,
      target: this.target,
      condition: this.condition,
    };

    return context;
  }

  /**
   * The first target in the user targets
   * @type {Token}
   */
  target = game.user.targets.first();

  /**
   * The hook ID for canceling the hook on close
   * @type {number}
   */
  hook;

  /** The condition label for the statusId */
  get condition() {
    return CONFIG.statusEffects.find(condition => condition.id === this.options.context.statusId)?.name ?? "";
  }

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.Effect.TargetedConditionPrompt.Title", {
      condition: this.condition,
    });
  }

  /** @inheritdoc */
  _onFirstRender(context, options) {
    this.hook = Hooks.on("targetToken", (user, token, active) => {
      if (!active) return;

      this.target = token;
      this.render(true);
    });
  }

  /** @inheritdoc */
  _onClose(options) {
    Hooks.off("targetToken", this.hook);
  }

  /**
   * Set a final context for resolving the prompt, then close the dialog
   * @inheritdoc
   */
  async _onSubmitForm(formConfig, event) {
    this.promptValue = this.target?.actor?.uuid;

    super._onSubmitForm(formConfig, event);
  }

  /**
   * Spawn a TargetedConditionPrompt and wait for and actor to be selected or closed.
   * @param {Partial<ApplicationConfiguration>} [options]
   * @returns {Promise<string | null>}      Resolves to the actor uuid of the actor imposing the condition or null
   */
  static async prompt(options) {
    return new Promise((resolve, reject) => {
      const dialog = new this(options);
      dialog.addEventListener("close", event => resolve(dialog.promptValue), { once: true });

      dialog.render({ force: true });
    });
  }
}
