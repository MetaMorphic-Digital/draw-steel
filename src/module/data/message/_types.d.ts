import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import ModelCollection from "../../utils/model-collection.mjs";
import * as part from "../pseudo-documents/message-parts/_module.mjs";

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

type MessagePart = part.ContentPart | part.RollPart | part.TestPart | part.ProjectPart;

declare module "./standard.mjs" {
  export default interface StandardModel {
    parent: DrawSteelChatMessage;
    parts: ModelCollection<MessagePart>;
  }
}
