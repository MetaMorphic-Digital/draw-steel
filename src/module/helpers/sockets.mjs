import { systemID } from "../constants.mjs";
import { HeroTokenPart } from "../data/pseudo-documents/message-parts/_module.mjs";
import DrawSteelChatMessage from "../documents/chat-message.mjs";

/** @import { DrawSteelActiveEffect, DrawSteelUser } from "../documents/_module.mjs"; */

export default class DrawSteelSocketHandler {
  constructor() {
    this.#registerQueries();
  }

  /* -------------------------------------------------- */

  /**
   * Register queries.
   */
  #registerQueries() {
    CONFIG.queries[systemID] = async ({ type, config }, queryOptions) => {
      switch (type) {
        case "spendHeroToken":
          return this.#spendHeroToken(config);
        case "rollSave":
          return this.#rollSave(config, queryOptions);
      }
    };
  }

  /* -------------------------------------------------- */

  /**
   * Tell the GM to spend a hero token.
   * @param {object} payload
   * @param {string} payload.userId
   * @param {string} payload.spendType
   * @param {string} [payload.flavor]
   * @param {string} [payload.messageId]
   */
  async spendHeroToken({ userId, spendType, flavor, messageId }) {
    const user = game.users.activeGM;
    if (!user) {
      return void ui.notifications.error("DRAW_STEEL.SOCKET.WARNING.noActiveGM", { localize: true });
    }

    if (user.isSelf) return this.#spendHeroToken({ userId, spendType, flavor, messageId });
    return user.query(systemID, {
      type: "spendHeroToken",
      config: { userId, spendType, flavor, messageId },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Spend a hero token.
   * @param {object} payload
   * @param {string} payload.userId
   * @param {string} payload.spendType
   * @param {string} [payload.flavor]
   * @param {string} [payload.messageId]
   */
  async #spendHeroToken({ userId, spendType, flavor, messageId }) {
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
    if (messageId) {
      HeroTokenPart.create({
        spendType,
        type: "heroToken",
      }, { parent: game.messages.get(options.messageId) });
    }
    else DrawSteelChatMessage.create({
      author: userId,
      content: tokenSpendConfiguration.messageContent,
      flavor: flavor ?? sendingUser?.character?.name,
    });
  }

  /* -------------------------------------------------- */

  /**
   * Call for a saving throw from a specific user.
   * @param {string | DrawSteelActiveEffect} effect   An effect instance or UUID.
   * @param {string | DrawSteelUser} user             A user instance or ID.
   * @param {object} rollOptions
   * @param {object} dialogOptions
   * @param {object} messageData
   * @param {object} messageOptions
   * @returns {object} The constructed message data.
   */
  async rollSave(effect, user, rollOptions = {}, dialogOptions = {}, messageData = {}, messageOptions = {}) {
    if (typeof user === "string") user = game.users.get(user);

    if (!user) throw new Error("No user found for DrawSteelSocketHandler#rollSave");

    if (user.isSelf) {
      if (typeof effect === "string") effect = await fromUuid(effect);
      const message = effect.system.rollSave(rollOptions, dialogOptions, messageData, messageOptions);
      return message instanceof DrawSteelChatMessage ? message.toObject() : message;
    }

    const effectUuid = typeof effect === "string" ? effect : effect.uuid;

    return user.query(systemID, {
      type: "rollSave",
      config: {
        userId: game.userId,
        effectUuid,
        rollOptions,
        dialogOptions,
        messageData,
        messageOptions,
      },
    }, { timeout: 30 * 1000 });
  }

  /* -------------------------------------------------- */

  /**
   * Query a user for a saving throw roll.
   * @param {Object} payload
   * @param {string} payload.userId               The ID of the user who sent the save request.
   * @param {string} payload.effectUuid           The effect to save on.
   * @param {object} [payload.rollOptions={}]     Options forwarded to new {@linkcode SavingThrowRoll}.
   * @param {object} [payload.dialogOptions={}]   Options forwarded to {@linkcode SavingThrowDialog.create}.
   * @param {object} [payload.messageData={}]     The data object to use when creating the message.
   * @param {object} [payload.messageOptions={}]  Additional options which modify the created message.
   * @param {object} [queryOptions]                    The query options.
   * @param {number} [queryOptions.timeout]            The timeout in milliseconds.
   * @returns {object} The constructed message data.
  */
  async #rollSave({ userId, effectUuid, rollOptions = {}, dialogOptions = {}, messageData = {}, messageOptions = {} }, { timeout }) {
    dialogOptions.timeout = timeout;

    /**
     * Effect should almost always be in-world anyways but we can safely fromUuid.
     * @type {DrawSteelActiveEffect}
     */
    const effect = await fromUuid(effectUuid);

    const message = await effect.system.rollSave(rollOptions, dialogOptions, messageData, messageOptions);

    return message instanceof DrawSteelChatMessage ? message.toObject() : message;
  }
}
