
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
  async toMessage(messageData = {}, { rollMode, create = true } = {}) {
    if (!this.constructor.PART_TYPE) return super.toMessage(messageData, { rollMode, create });

    if (rollMode === "roll") rollMode = undefined;
    rollMode ||= game.settings.get("core", "rollMode");

    if (!this._evaluated) await this.evaluate({ allowInteractive: rollMode !== CONST.DICE_ROLL_MODES.BLIND });

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
    msg.applyRollMode(rollMode);

    if (create) return Cls.create(msg);
    return msg.toObject();
  }
}
