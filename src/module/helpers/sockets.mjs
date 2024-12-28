import {systemID} from "../constants.mjs";

export default class DrawSteelSocketHandler {
  constructor() {
    this.identifier = "system.draw-steel";
    this.registerSocketHandlers();
  }

  /* -------------------------------------------------- */

  /**
   * Sets up socket reception
   */
  registerSocketHandlers() {
    game.socket.on(this.identifier, ({type, payload}) => {
      switch (type) {
        case "spendHeroToken":
          this.spendHeroToken(payload);
          break;
        default:
          throw new Error("Unknown type");
      }
    });
  }

  /* -------------------------------------------------- */

  /**
   * Emits a socket message to all other connected clients
   * @param {string} type
   * @param {object} payload
   */
  emit(type, payload) {
    game.socket.emit(this.identifier, {type, payload});
  }

  /**
   * Tell the GM to spend a hero token
   * @param {object} payload
   */
  spendHeroToken(payload) {
    const {userId} = payload;
    // TODO: Refactor in v13 to just call isActiveGM
    if (game.users.activeGM !== game.user) return;
    const settingName = "heroTokens";
    const heroTokens = game.settings.get(systemID, settingName).value;
    if (heroTokens < 1) {
      // TODO: Refactor in v13 to use notification formatting
      const message = game.i18n.format("DRAW_STEEL.Setting.HeroTokens.WarnDirectorBadSpend", {name: game.users.get(userId)?.name ?? "Unknown"});
      ui.notifications.error(message);
      return;
    }
    game.settings.set(systemID, settingName, {value: heroTokens - 1});
  }
}
