
/**
 * Base roll class for Draw Steel.
 */
export default class DSRoll extends foundry.dice.Roll {
  /**
   * The type used for the `part` of a standard message.
   * @type {string}
   */
  static PART_TYPE = "roll";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toMessage(messageData = {}, { messageMode, rollMode, create = true } = {}) {
    if (!this.constructor.PART_TYPE) return super.toMessage(messageData, { rollMode, create });

    if (rollMode) {
      foundry.utils.logCompatibilityWarning("The rollMode option of Roll#toMessage is deprecated in favor of"
        + " messageMode, a string value in CONFIG.ChatMessage.modes", { since: 14, until: 16 });
      messageMode = DSRoll._mapLegacyRollMode(rollMode);
    }
    messageMode ||= game.settings.get("core", "messageMode");

    // Perform the roll, if it has not yet been rolled
    if (!this._evaluated) await this.evaluate({ allowInteractive: messageMode !== "blind" });

    const id = foundry.utils.randomID();
    messageData = foundry.utils.mergeObject({
      type: "standard",
      system: {},
      author: game.user.id,
      sound: CONFIG.sounds.dice,
    }, messageData);
    messageData.system.parts = {
      [id]: {
        _id: id,
        flavor: messageData.flavor,
        rolls: [this],
        type: this.constructor.PART_TYPE,
      },
    };
    delete messageData.flavor;

    const Cls = getDocumentClass("ChatMessage");
    const msg = new Cls(messageData);
    msg.applyMode(messageMode);

    if (create) return Cls.create(msg);
    return msg.toObject();
  }
}
