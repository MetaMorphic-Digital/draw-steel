/**
 * A document subclass adding system-specific behavior and registered in CONFIG.ChatMessage.documentClass.
 */
export default class DrawSteelChatMessage extends foundry.documents.ChatMessage {
  /** @inheritdoc */
  get isRoll() {
    return this.system.isRoll ?? super.isRoll;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get visible() {
    return (this.system.visible ?? true) && super.visible;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareChatMessageData", this);
  }
}
