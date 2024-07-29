export class DrawSteelChatMessage extends ChatMessage {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareChatMessageData", this);
  }
}
