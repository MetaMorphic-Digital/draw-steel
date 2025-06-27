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

  /* -------------------------------------------------- */

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.HeroTokens.Label";

  /** Localized name for the setting */
  get label() {
    return game.i18n.localize(this.constructor.label);
  }

  /* -------------------------------------------------- */

  /** Helper text for Hero Tokens */
  static hint = "DRAW_STEEL.Setting.HeroTokens.Hint";

  /** Localized helper text for Hero Token */
  get hint() {
    return game.i18n.localize(this.constructor.hint);
  }

  /* -------------------------------------------------- */

  /**
   * Send a socket message to the Director to spend a hero token
   * Necessary because only game masters can modify world settings
   * @param {string} spendType        Key of `ds.CONFIG.hero.tokenSpends`.
   * @param {object} [options]        Options to modify the token spend
   * @param {string} [options.flavor] Flavor for the chat message (default: Current user's character name)
   * @returns {Promise<void|false>}   An explicit `false` if there was an error in spending the token
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
    const currentTokens = game.actors.heroTokens.value;
    if (currentTokens < tokenSpendConfiguration.tokens) {
      ui.notifications.error("DRAW_STEEL.Setting.HeroTokens.NoHeroTokens", { localize: true });
      return false;
    }
    // Just directly execute if the current user is a game master
    if (game.user.isGM) {
      await game.settings.set(systemID, "heroTokens", { value: currentTokens - tokenSpendConfiguration.tokens });
      await DrawSteelChatMessage.create({
        content: tokenSpendConfiguration.messageContent,
        flavor: options.flavor ?? game.user.character?.name,
      });
    }
    else game.system.socketHandler.spendHeroToken({ userId: game.userId, spendType, flavor: options.flavor });
  }

  /* -------------------------------------------------- */

  /**
   * Give out hero tokens
   * @param {number} [count=1] How many tokens to give out (default: `1`)
   * @param {object} [options]  Options.
   * @param {boolean} [options.chatMessage=true]  Should a chat message be created? (default: `true`)
   * @returns {number} The new number of hero tokens
   */
  async giveToken(count = 1, { chatMessage = true } = {}) {
    if (!game.user.isGM) {
      console.error("Only a GM can give tokens");
      return;
    }
    const currentTokens = game.actors.heroTokens.value;
    const value = currentTokens + count;
    await game.settings.set(systemID, "heroTokens", { value });
    if (chatMessage) await DrawSteelChatMessage.create({
      content: `<p>${game.i18n.format("DRAW_STEEL.Setting.HeroTokens.GrantedTokens", { count })}</p>`,
    });
    return value;
  }

  /* -------------------------------------------------- */

  /**
   * Reset tokens to the number of heroes in the party
   * @param {object} [options]  Options.
   * @param {boolean} [options.chatMessage=true]  Should a chat message be created? (default: `true`)
   */
  async resetTokens({ chatMessage = true } = {}) {
    if (!game.user.isGM) {
      console.error("Only a GM can reset hero tokens");
      return;
    }

    // TODO: Revisit after #369

    const nonGM = game.users.filter(u => !u.isGM);
    await game.settings.set(systemID, "heroTokens", { value: nonGM.length });
    if (chatMessage) await DrawSteelChatMessage.create({
      content: `<p>${game.i18n.format("DRAW_STEEL.Setting.HeroTokens.StartSession", { count: nonGM.length })}</p>`,
    });
  }
}
