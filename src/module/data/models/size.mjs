const fields = foundry.data.fields;

/**
 * A data model to represent the size of a creature in Draw Steel
 */
export default class SizeModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      value: new fields.NumberField({ initial: 1, required: true, nullable: false, integer: true, min: 1 }),
      letter: new fields.StringField({ initial: "M", choices: ds.CONFIG.sizes }),
    };
  }

  /** @inheritdoc */
  toString() {
    const letter = this.value === 1 ? this.letter ?? "" : "";
    return this.value + letter;
  }
}
