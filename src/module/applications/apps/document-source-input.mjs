import { systemPath } from "../../constants.mjs";
import DocumentInput from "../api/document-input.mjs";

/**
 * Simple live-updating input for {@linkcode ds.data.models.SourceModel | `SourceModel`}
 */
export default class DocumentSourceInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["document-source"],
    window: {
      title: "DRAW_STEEL.Source.UpdateTitle",
      icon: "fa-solid fa-book",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/sheets/document-input/document-source-input.hbs"),
    },
  };

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.sourceValues = this.document.system.source._source;

    context.sourceFields = this.document.system.source.schema.fields;

    return context;
  }
}
