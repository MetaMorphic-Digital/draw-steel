import SizeModel from "./size.mjs";

const fields = foundry.data.fields;

/**
 * A data model to represent the size of an object in Draw Steel.
 */
export default class ObjectSizeModel extends SizeModel {
  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    Object.assign(schema, {
      text: new fields.StringField({ required: true }),
      direction: new fields.StringField({ required: true }),
      typical: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Placeholder value for the text input.
   * @type {string}
   */
  get textPlaceholder() {
    return super.toString();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return this.text || super.toString();
  }
}
