import DSRoll from "../../../rolls/base.mjs";

declare module "./base.mjs" {
  export default interface MessagePart {
    type: string;
    rolls: DSRoll[],
    flavor: string;
  }
}
