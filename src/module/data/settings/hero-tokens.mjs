import {systemID} from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * A data model to manage Hero Tokens in Draw Steel
 */
export class HeroTokenModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new fields.NumberField({required: true, nullable: false, initial: 0, integer: true, min: 0})
    };
  }

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.HeroTokens.Label";

  /** Helper text for Hero Tokens */
  static hint = "DRAW_STEEL.Setting.HeroTokens.Hint";

  /**
   * Send a socket message to the Director to spend a hero token
   * Necessary because only game masters can modify world settings
   * @param {string} spendType - Key of ds.CONFIG.hero.tokenSpends
   * @returns {boolean} Returns an explicit false if the socket message wasn't sent
   */
  spendToken(spendType) {
    if (!game.users.activeGM) {
      ui.notifications.error("DRAW_STEEL.Setting.NoActiveGM", {localize: true});
      return false;
    }
    const tokenSpend = ds.CONFIG.hero.tokenSpends[spendType];
    if (!tokenSpend) {
      console.error("Invalid spendType");
      return false;
    }
    const currentTokens = game.settings.get(systemID, "heroTokens").value;
    if (currentTokens < tokenSpend.tokens) {
      ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.NoHeroTokens", {localize: true});
      return false;
    }
    game.system.socketHandler.emit("spendHeroToken", {userId: game.userId, spendType});
  }
}