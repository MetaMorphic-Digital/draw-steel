import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import MessagePart from "./parts/base.mjs";
import "./parts/_types";

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

declare module "./standard.mjs" {
  export default interface StandardModel {
    parts: MessagePart[]
  }
}
