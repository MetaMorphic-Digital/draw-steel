import PseudoDocument from "./pseudo-document.mjs";

const { StringField } = foundry.data.fields;

export default class TypedPseudoDocument extends PseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      types: null,
    };
  }

  /* -------------------------------------------------- */

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
   * @type {Record<string, typeof PseudoDocument>}
   */
  static get TYPES() {
    return Object.values(this.metadata.types).reduce((acc, Cls) => {
      if (Cls.TYPE) acc[Cls.TYPE] = Cls;
      return acc;
    }, {});
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
}
