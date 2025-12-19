import DrawSteelTokenDocument from "../documents/token.mjs";
import "./placeables/tokens/_types";

declare module "@client/canvas/placeables/token.mjs" {
  export default interface Token {
    document: DrawSteelTokenDocument;
  }
}
