/**
 * A document subclass adding system-specific behavior and registered in CONFIG.ChatMessage.documentClass
 */
export default class DrawSteelChatMessage extends ChatMessage {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareChatMessageData", this);
  }
}
