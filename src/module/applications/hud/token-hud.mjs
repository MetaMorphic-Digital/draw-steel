import { systemPath } from "../../constants.mjs";

/**
 * A custom Token HUD that implements Draw Steel effect handling
 */
export default class DrawSteelTokenHUD extends foundry.applications.hud.TokenHUD {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      effect: {
        handler: this.#onToggleEffect,
      },
    },
  };

  /**
   * Current option for the select, not stored in the database and shared between all tokens.
   * Expected to be be a valid key of {@linkcode ds.CONFIG.effectEnds}.
   * @type {string}
   */
  #effectEnd = "";

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    context.dsEffectEnds = {
      selected: this.#effectEnd,
      options: ds.CONFIG.effectEnds,
    };

    const effectPalette = this.element.querySelector("div[data-palette=\"effects\"]");

    const paletteContents = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/effect-palette.hbs"), context);

    effectPalette.innerHTML = paletteContents;

    const effectEndSelect = effectPalette.querySelector("[data-name=\"system.end.type\"]");

    effectEndSelect.addEventListener("change", (ev) => {
      this.#effectEnd = effectEndSelect.value;
    });
  }

  /**
   * Handle toggling a token status effect icon.
   * @this {DrawSteelTokenHUD}
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #onToggleEffect(event, target) {
    if (!this.actor) {
      ui.notifications.warn("HUD.WarningEffectNoActor", { localize: true });
      return;
    }
    const statusId = target.dataset.statusId;

    const effectEnd = this.#effectEnd;

    await this.actor.toggleStatusEffect(statusId, {
      active: !target.classList.contains("active"),
      overlay: event.button === 2,
      effectEnd,
    });
  }
}
