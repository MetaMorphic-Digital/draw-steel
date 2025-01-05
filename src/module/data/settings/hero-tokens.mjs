import {systemID} from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * A data model to manage Hero Tokens in Draw Steel
 */
export class HeroTokenModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new fields.NumberField({nullable: false, initial: 0, integer: true, min: 0})
    };
  }

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.HeroTokens.Label";

  /** Helper text for Hero Tokens */
  static hint = "DRAW_STEEL.Setting.HeroTokens.Hint";

  /**
   * Send a socket message to the Director to spend a hero token
   * Necessary because only game masters can modify world settings
   * @param {string} spendType       Key of `ds.CONFIG.hero.tokenSpends`.
   * @returns {void|false}           An explicit `false` if the socket message was not sent.
   */
  spendToken(spendType) {
    if (!game.users.activeGM) {
      ui.notifications.error("DRAW_STEEL.Setting.NoActiveGM", {localize: true});
      return false;
    }
    const tokenSpendConfiguration = ds.CONFIG.hero.tokenSpends[spendType];
    if (!tokenSpendConfiguration) {
      console.error("Invalid spendType");
      return false;
    }
    const currentTokens = game.settings.get(systemID, "heroTokens").value;
    if (currentTokens < tokenSpendConfiguration.tokens) {
      ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.NoHeroTokens", {localize: true});
      return false;
    }
    game.system.socketHandler.emit("spendHeroToken", {userId: game.userId, spendType});
  }
}
