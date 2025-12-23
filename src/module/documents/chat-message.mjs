import BaseDocumentMixin from "./base-document-mixin.mjs";

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.ChatMessage.documentClass.
 */
export default class DrawSteelChatMessage extends BaseDocumentMixin(foundry.documents.ChatMessage) {
  /** @inheritdoc */
  static migrateData(data) {

    // 0.10 type migrations
    if (data.type === "savingThrow") {
      data.type = "standard";
      data.system.parts = [{
        type: "savingThrow",
        effectUuid: data.system.effectUuid,
        rolls: data.rolls,
      }];
      foundry.utils.setProperty(data, "flags.draw-steel.migrateType", true);
    }

    return super.migrateData(data);
  }

  /* -------------------------------------------------- */

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
