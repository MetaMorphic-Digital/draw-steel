import { systemPath } from "../../constants.mjs";

/**
 * A custom Token HUD that implements Draw Steel effect handling
 */
export default class DrawSteelTokenHUD extends foundry.applications.hud.TokenHUD {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
    },
  };

  /**
   * Current option for the select, not stored in the database and shared between all tokens.
   */
  effectEnd = "";

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    context.dsEffectEnds = {
      selected: this.effectEnd,
      options: ds.CONFIG.effectEnds,
    };

    const effectPalette = this.element.querySelector("div[data-palette=\"effects\"]");

    const paletteContents = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/effect-palette.hbs"), context);

    effectPalette.innerHTML = paletteContents;

    const effectEndSelect = effectPalette.querySelector("[data-name=\"system.end.type\"]");

    effectEndSelect.addEventListener("change", (ev) => {
      this.effectEnd = effectEndSelect.value;
    });
  }
}
