import { systemID } from "../../constants.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";

const fields = foundry.data.fields;

/**
 * A data model to manage Hero Tokens in Draw Steel
 */
export class HeroTokenModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      value: new fields.NumberField({ nullable: false, initial: 0, integer: true, min: 0 }),
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
   * @param {object} [options]       Options to modify the token spend
   * @param {string} [options.flavor] Flavor for the chat message (default: Current user's character name)
   * @returns {Promise<void|false>}           An explicit `false` if there was an error in spending the token
   */
  async spendToken(spendType, options = {}) {
    if (!game.users.activeGM) {
      ui.notifications.error("DRAW_STEEL.Setting.NoActiveGM", { localize: true });
      return false;
    }
    const tokenSpendConfiguration = ds.CONFIG.hero.tokenSpends[spendType];
    if (!tokenSpendConfiguration) {
      console.error("Invalid spendType");
      return false;
    }
    const currentTokens = game.settings.get(systemID, "heroTokens").value;
    if (currentTokens < tokenSpendConfiguration.tokens) {
      ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.NoHeroTokens", { localize: true });
      return false;
    }
    // Just directly execute if the current user is a game master
    if (game.user.isGM) {
      await game.settings.set(systemID, "heroTokens", { value: currentTokens - tokenSpendConfiguration.tokens });
      await DrawSteelChatMessage.create({
        author: game.userId,
        content: tokenSpendConfiguration.messageContent,
        flavor: options.flavor ?? game.user.character?.name,
      });
    }
    else game.system.socketHandler.emit("spendHeroToken", { userId: game.userId, spendType, flavor: options.flavor });
  }
}
