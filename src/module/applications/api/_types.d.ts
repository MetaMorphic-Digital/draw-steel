export {};

type ClientDocument = InstanceType<ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>>;

declare module "./document-input.mjs" {
  export default interface DocumentInput extends foundry.applications.api.DocumentSheet {
    document: ClientDocument;
  }
}

declare module "./document-sheet.mjs" {
  export default interface DSDocumentSheet extends foundry.applications.api.DocumentSheet {
    document: ClientDocument;
  }
}
