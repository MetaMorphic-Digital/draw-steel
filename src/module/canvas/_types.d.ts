import DrawSteelTokenDocument from "../documents/token.mjs";

declare module "./placeables/token.mjs" {
  export default interface Token {
    document: DrawSteelTokenDocument;
  }
}
