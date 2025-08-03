import Document from "@common/abstract/document.mjs";

declare module "./document-input.mjs" {
  export default interface DocumentInput {
    document: Document;
  }
}
