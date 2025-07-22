import { systemPath } from "../../constants.mjs";
import PseudoDocument from "./pseudo-document.mjs";

/** @import { FormSelectOption } from "@client/applications/forms/fields.mjs" */

const { DocumentTypeField } = foundry.data.fields;

/**
 * A variant of PseudoDocument that allows for polymorphism across different values of `type`.
 */
export default class TypedPseudoDocument extends PseudoDocument {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      type: new DocumentTypeField(this),
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

  /** @inheritdoc */
  static CREATE_TEMPLATE = systemPath("templates/sheets/pseudo-documents/typed-create-dialog.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    this.img ||= ds.CONFIG[this.constructor.metadata.documentName][this.type].defaultImage;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    if (!this.name) {
      this.name = game.i18n.localize(`TYPES.${this.documentName}.${this.type}`);
    }
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _prepareCreateDialogContext(parent) {

    const typeOptions = Object.entries(ds.CONFIG[this.metadata.documentName]).map(([value, { label }]) => ({ value, label }));

    return {
      typeOptions,
      fields: this.schema.fields,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _createDialogRenderCallback(event, dialog) {
    const typeInput = dialog.element.querySelector("[name=\"type\"]");
    const nameInput = dialog.element.querySelector("[name=\"name\"]");
    nameInput.placeholder = ds.CONFIG[this.metadata.documentName][typeInput.value].label;
    typeInput.addEventListener("change", () => nameInput.placeholder = ds.CONFIG[this.metadata.documentName][typeInput.value].label);
  }
}
