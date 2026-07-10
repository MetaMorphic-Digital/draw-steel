/**
 * @import { DataFieldContext, DataFieldOptions } from "@common/data/_types.mjs";
 */

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * A field that unifies and hardens the Characteristic data across creatures and followers.
 */
export default class CharacteristicsField extends SchemaField {
  /**
   * @param {DataFieldOptions} [options]        Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]        Additional context which describes the field.
   */
  constructor(options = {}, context = {}) {
    const characteristic = { initial: 0, integer: true, nullable: false, placeholder: "0" };

    const fields = CharacteristicsField.#validCharacteristics.reduce((obj, chc) => {
      const { label, hint } = ds.CONFIG.characteristics[chc];
      obj[chc] = new SchemaField({
        value: new NumberField({ ...characteristic, label, hint }),
        resist: new NumberField({ required: true, nullable: false, integer: true, initial: 0, persisted: false }),
        edges: new NumberField({ required: true, nullable: false, integer: true, initial: 0, persisted: false }),
        banes: new NumberField({ required: true, nullable: false, integer: true, initial: 0, persisted: false }),
        dice: new SchemaField({
          mode: new StringField({ choices: ["kh", "kl"], initial: "kh" }),
          number: new NumberField({ required: true, nullable: false, integer: true, initial: 2, min: 1, persisted: false }),
          faces: new NumberField({ required: true, nullable: false, integer: true, initial: 10, min: 1, persisted: false }),
        }, { persisted: false }),
      });
      return obj;
    }, {});

    super(fields, options, context);
  }

  /**
   * A fixed, hard private list of valid characteristics in Draw Steel.
   */
  static #validCharacteristics = new Set(["might", "agility", "reason", "intuition", "presence"]);
}
