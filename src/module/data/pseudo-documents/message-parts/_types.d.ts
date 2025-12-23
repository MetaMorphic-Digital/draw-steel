import DSRoll from "../../../rolls/base.mjs";
import StandardModel from "../../message/standard.mjs";

declare module "./ability-result.mjs" {
  export default interface AbilityResult {
    abilityUuid: string;
    tier: number;
  }
}

declare module "./ability-use.mjs" {
  export default interface AbilityUse {
    abilityUuid: string;
  }
}

declare module "./base-message-part.mjs" {
  export default interface MessagePart {
    parent: StandardModel;
    type: string;
    rolls: DSRoll[],
    flavor: string;
  }
}

declare module "./test.mjs" {
  export default interface TestPart {
    results: {
      tier1: string;
      tier2: string;
      tier3: string;
      critical: string;
    }
  }
}
