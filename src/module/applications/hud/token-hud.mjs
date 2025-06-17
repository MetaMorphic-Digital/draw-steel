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

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const effectPalette = this.element.querySelector("div[data-palette=\"effects\"]");

    console.log(context, options, effectPalette);

    const paletteContents = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/effect-palette.hbs"), context);

    effectPalette.innerHTML = paletteContents;
  }
}
