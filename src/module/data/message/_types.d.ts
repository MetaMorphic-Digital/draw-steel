import { DrawSteelChatMessage } from "../../documents/chat-message.mjs";

declare module "./base.mjs" {
  export default interface BaseMessageModel {
    parent: DrawSteelChatMessage;
  }
}
