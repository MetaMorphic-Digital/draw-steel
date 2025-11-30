import DSRoll from "../../../rolls/base.mjs";
import StandardModel from "../standard.mjs";

declare module "./base.mjs" {
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
