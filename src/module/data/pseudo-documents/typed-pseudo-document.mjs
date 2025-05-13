import PseudoDocument from "./pseudo-document.mjs";

/** @import { TypedPseudoDocumentCreateDialogOptions } from "./_types" */

const { StringField } = foundry.data.fields;

/**
 * A variant of PseudoDocument that allows for polymorphism across different values of `type`.
 */
export default class TypedPseudoDocument extends PseudoDocument {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      type: new StringField({
        initial: () => this.TYPE,
        required: true,
        blank: false,
        readonly: true,
        validate: value => value === this.TYPE,
        validationError: `Type can only be '${this.TYPE}'.`,
      }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The type of this pseudo-document subclass.
   * @type {string}
   * @abstract
   */
  static get TYPE() {
    return "";
  }

  /* -------------------------------------------------- */

  /**
   * The subtypes of this pseudo-document.
   * @type {Record<string, typeof TypedPseudoDocument>}
   */
  static get TYPES() {
    return Object.values(ds.CONFIG[this.metadata.documentName]).reduce((acc, { documentClass }) => {
      if (documentClass.TYPE) acc[documentClass.TYPE] = documentClass;
      return acc;
    }, {});
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this typed pseudodocument's type
   * @type {string}
   */
  get typeLabel() {
    return ds.CONFIG[this.constructor.metadata.documentName][this.type].label;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async create(data = {}, { parent, ...operation } = {}) {
    data = foundry.utils.deepClone(data);
    if (!data.type) data.type = Object.keys(this.TYPES)[0];
    if (!(data.type in this.TYPES)) {
      throw new Error(`The '${data.type}' type is not a valid type for a '${this.metadata.documentName}' pseudo-document!`);
    }
    return super.create(data, { parent, ...operation });
  }

  /**
   * Create a new instance of this pseudo-document with a prompt to choose the type.
   * @param {object} [data]                                     The data used for the creation.
   * @param {object} createOptions                              The context of the operation.
   * @param {foundry.abstract.Document} createOptions.parent    The parent of this document.
   * @param {TypedPseudoDocumentCreateDialogOptions} [options={}]
   * @returns {Promise<foundry.abstract.Document>}              A promise that resolves to the updated document.
   */
  static async createDialog(data = {}, createOptions = {}, options = {}) {
    /** @type {TypedPseudoDocumentCreateDialogOptions} */
    const defaultOptions = {
      window: {
        title: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize(this.metadata.label) }),
        icon: this.metadata.icon,
      },
      content: this.schema.fields.type.toFormGroup({
        label: "DOCUMENT.FIELDS.type.label",
        localize: true,
      }, {
        choices: ds.CONFIG[this.metadata.documentName],
      }).outerHTML,
    };

    const inputData = await ds.applications.api.DSDialog.input(foundry.utils.mergeObject(defaultOptions, options));

    if (!inputData) return;

    foundry.utils.mergeObject(data, inputData);

    return this.create(data, createOptions);
  }
}
