import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

export default class DocumentSourceInput extends DocumentInput {
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input/document-source-input.hbs"),
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.sourceValues = this.document.system.source._source;

    context.sourceFields = this.document.system.source.schema.fields;

    return context;
  }
}
