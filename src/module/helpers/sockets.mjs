import { systemID } from "../constants.mjs";
import DrawSteelChatMessage from "../documents/chat-message.mjs";

export default class DrawSteelSocketHandler {
  constructor() {
    this.#registerQueries();
  }

  /* -------------------------------------------------- */

  /**
   * Register queries.
   */
  #registerQueries() {
    CONFIG.queries[systemID] = ({ type, config }) => {
      switch (type) {
        case "spendHeroToken":
          return this.#spendHeroToken(config);
      }
    };
  }

  /* -------------------------------------------------- */

  /**
   * Tell the GM to spend a hero token.
   * @param {object} payload
   * @param {string} payload.userId
   * @param {string} payload.spendType
   * @param {string} payload.flavor
   */
  async spendHeroToken({ userId, spendType, flavor }) {
    const user = game.users.activeGM;
    if (!user) {
      return void ui.notifications.error("DRAW_STEEL.SOCKET.WARNING.noActiveGM", { localize: true });
    }

    if (user.isSelf) return this.#spendHeroToken({ userId, spendType, flavor });
    return user.query("draw-steel", {
      type: "spendHeroToken",
      config: { userId, spendType, flavor },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Spend a hero token.
   * @param {object} payload
   * @param {string} payload.userId
   * @param {string} payload.spendType
   * @param {string} payload.flavor
   */
  #spendHeroToken({ userId, spendType, flavor }) {
    const sendingUser = game.users.get(userId);
    const userName = sendingUser?.name ?? userId;
    const tokenSpendConfiguration = ds.CONFIG.hero.tokenSpends[spendType];

    if (!tokenSpendConfiguration) {
      return void ui.notifications.error("DRAW_STEEL.SOCKET.WARNING.invalidSpendType", {
        format: { spendType, name: userName },
      });
    }

    const settingName = "heroTokens";
    const heroTokens = game.settings.get(systemID, settingName).value;

    if (heroTokens < tokenSpendConfiguration.token) {
      return void ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.WarnDirectorBadSpend", {
        format: { name: userName },
      });
    }

    game.settings.set(systemID, settingName, { value: heroTokens - tokenSpendConfiguration.tokens });
    DrawSteelChatMessage.create({
      author: userId,
      content: tokenSpendConfiguration.messageContent,
      flavor: flavor ?? sendingUser?.character?.name,
    });
  }
}
