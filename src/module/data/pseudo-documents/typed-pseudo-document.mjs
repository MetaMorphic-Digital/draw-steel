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
  static async createDialog(data = {}, { parent, ...operation } = {}) {
    /** @type {FormSelectOption[]} */
    const typeOptions = Object.keys(this.TYPES).map(type => ({
      value: type,
      label: game.i18n.localize(`TYPES.${this.metadata.documentName}.${type}`),
    }));

    // If there's demand or need we can make the template & context more dynamic
    const content = await foundry.applications.handlebars.renderTemplate(systemPath("templates/sheets/pseudo-documents/create-dialog.hbs"), {
      fields: this.schema.fields,
      typeOptions,
    });

    const result = await ds.applications.api.DSDialog.input({
      window: {
        title: game.i18n.format("DOCUMENT.New", { type: game.i18n.localize(`DOCUMENT.${this.metadata.documentName}`) }),
        icon: this.metadata.icon,
      },
      content,
      render: (event, dialog) => {
        const typeInput = dialog.element.querySelector("[name=\"type\"]");
        const nameInput = dialog.element.querySelector("[name=\"name\"]");
        nameInput.placeholder = typeOptions.find(o => o.value === typeInput.value).label;
        typeInput.addEventListener("change", () => nameInput.placeholder = typeOptions.find(o => o.value === typeInput.value).label);
      },
    });
    if (!result) return null;
    return this.create({ ...data, ...result }, { parent, ...operation });
  }
}
