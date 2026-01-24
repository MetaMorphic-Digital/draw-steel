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
      text: new fields.StringField({ blank: false }),
      direction: new fields.StringField({ blank: false }),
      typical: new fields.StringField({ blank: false }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    const letter = this.value === 1 ? this.letter ?? "" : "";
    return this.value + letter;
  }
}
