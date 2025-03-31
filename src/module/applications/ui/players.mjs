import { systemID, systemPath } from "../../constants.mjs";

/**
 * An extension of the core Players display that adds
 */
export default class DrawSteelPlayers extends foundry.applications.ui.Players {
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const metaCurrencyDisplay = await foundry.applications.handlebars.renderTemplate(systemPath("templates/ui/players.hbs"), {
      heroTokens: game.settings.get(systemID, "heroTokens"),
      malice: game.settings.get(systemID, "malice"),
      showMalice: game.user.isGM || game.settings.get(systemID, "showPlayerMalice"),
    });

    this.element.insertAdjacentHTML("beforeend", metaCurrencyDisplay);
  }
}
