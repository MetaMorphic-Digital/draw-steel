import DrawSteelChatMessage from "../../documents/chat-message.mjs";

declare module "./base.mjs" {
  export default interface BaseMessageModel {
    parent: DrawSteelChatMessage;
    /** A set of DrawSteelTokenDocument UUIDs. */
    targets: Set<string>;
  }
}

declare module "./ability-use.mjs" {
  export default interface AbilityUseModel {
    uuid: string;
    embedText: boolean;
  }
}

declare module "./saving-throw.mjs" {
  export default interface SavingThrowModel {
    effectUuid: string;
  }
}
