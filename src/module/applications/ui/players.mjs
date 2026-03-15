import { systemID, systemPath } from "../../constants.mjs";

/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 * @import { HeroTokenModel } from "../../data/settings/hero-tokens.mjs";
 * @import { MaliceModel } from "../../data/settings/malice.mjs";
 */

/**
 * An extension of the core Players display that adds controls for hero tokens and malice.
 */
export default class DrawSteelPlayers extends foundry.applications.ui.Players {
  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Can adjust if it makes sense to have hero token controls for non-GMs (e.g. a more generic hero action)
    this._createContextMenu(this._metaCurrencyContextMenuOptions, "#meta-currency .context-menu", {
      eventName: "click",
      hookName: "getMetaCurrencyContextOptions",
      parentClassHooks: false,
      fixed: true,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const metaCurrencyDisplay = await foundry.applications.handlebars.renderTemplate(systemPath("templates/ui/players.hbs"), {
      heroTokens: game.actors.heroTokens,
      malice: game.actors.malice,
      showMalice: (game.settings.get(systemID, "showPlayerMalice") || game.user.isGM) && game.combat,
      gm: game.user.isGM,
    });

    this.element.insertAdjacentHTML("beforeend", metaCurrencyDisplay);
  }

  /* -------------------------------------------------- */

  /**
   * Context menu entries for the Hero Token menu button.
   * @returns {ContextMenuEntry}
   */
  _metaCurrencyContextMenuOptions() {
    return [
      {
        label: "DRAW_STEEL.Setting.HeroTokens.GiveToken",
        icon: "fa-solid fa-fw fa-plus",
        visible: () => game.user.isGM,
        onClick: async (event, target) => {
          /** @type {HeroTokenModel} */
          const heroTokens = game.actors.heroTokens;
          await heroTokens.giveToken();
        },
      },
      {
        label: "DRAW_STEEL.Setting.HeroTokens.SpendToken",
        icon: "fa-solid fa-fw fa-minus",
        onClick: async (event, target) => {
          /** @type {HeroTokenModel} */
          const heroTokens = game.actors.heroTokens;
          await heroTokens.spendToken("generic");
        },
      },
      {
        label: "DRAW_STEEL.Setting.HeroTokens.ResetToken",
        icon: "fa-solid fa-fw fa-rotate",
        visible: () => game.user.isGM,
        onClick: async (event, target) => {
          /** @type {HeroTokenModel} */
          const heroTokens = game.actors.heroTokens;
          await heroTokens.resetTokens();
        },
      },
      {
        label: "DRAW_STEEL.Setting.Malice.AdjustMalice.label",
        icon: "fa-solid fa-fw fa-plus-minus",
        visible: () => game.user.isGM && game.combat,
        onClick: async (event, target) => {
          /** @type {MaliceModel} */
          const malice = game.actors.malice;
          await malice.adjustMalice();
        },
      },
      {
        label: "DRAW_STEEL.Setting.Malice.ResetMalice",
        icon: "fa-solid fa-fw fa-rotate",
        visible: () => game.user.isGM && game.combat,
        onClick: async (event, target) => {
          /** @type {MaliceModel} */
          const malice = game.actors.malice;
          await malice.resetMalice();
        },
      },
    ];
  }
}
