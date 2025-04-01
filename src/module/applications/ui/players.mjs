import { systemID, systemPath } from "../../constants.mjs";

/** @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs" */
/** @import { HeroTokenModel } from "../../data/settings/hero-tokens.mjs"; */

/**
 * An extension of the core Players display that adds controls for hero tokens and malice
 */
export default class DrawSteelPlayers extends foundry.applications.ui.Players {
  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Can adjust if it makes sense to have hero token controls for non-GMs (e.g. a more generic hero action)
    if (game.user.isGM) {
      this._createContextMenu(this._heroTokenContextMenuOptions, ".hero-tokens .context-menu", {
        eventName: "click",
        hookName: "getHeroTokenContextOptions",
        parentClassHooks: false,
        fixed: true,
      });
    }
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const metaCurrencyDisplay = await foundry.applications.handlebars.renderTemplate(systemPath("templates/ui/players.hbs"), {
      heroTokens: game.settings.get(systemID, "heroTokens"),
      malice: game.settings.get(systemID, "malice"),
      showMalice: game.user.isGM || game.settings.get(systemID, "showPlayerMalice"),
      gm: game.user.isGM,
    });

    this.element.insertAdjacentHTML("beforeend", metaCurrencyDisplay);
  }

  /**
   * Context menu entries for the Hero Token menu button
   * @returns {ContextMenuEntry}
   */
  _heroTokenContextMenuOptions() {
    return [
      {
        name: "DRAW_STEEL.Setting.HeroTokens.GiveToken",
        icon: "<i class=\"fa-solid fa-plus\"></i>",
        condition: li => game.user.isGM,
        callback: async li => {
          /** @type {HeroTokenModel} */
          const heroTokens = game.settings.get(systemID, "heroTokens");
          await heroTokens.giveToken();
        },
      },
      {
        name: "DRAW_STEEL.Setting.HeroTokens.ResetToken",
        icon: "<i class=\"fa-solid fa-rotate\"></i>",
        condition: li => game.user.isGM,
        callback: async li => {
          /** @type {HeroTokenModel} */
          const heroTokens = game.settings.get(systemID, "heroTokens");
          await heroTokens.resetTokens();
        },
      },
    ];
  }
}
