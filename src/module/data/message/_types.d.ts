import { DrawSteelChatMessage } from "../../documents/chat-message.mjs";

declare module "./base.mjs" {
  export default interface BaseMessageModel {
    parent: DrawSteelChatMessage;
  }
}

declare module "./ability-use.mjs" {
  export default interface AbilityUseModel {
    uuid: string;
  }
}
