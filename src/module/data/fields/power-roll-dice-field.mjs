/**
 * @import { DataFieldContext, DataFieldOptions } from "@common/data/_types.mjs";
 */

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field storing the dice to be used for a Power Roll.
 * Default is 2d10, some abilities allow modification to 3d10 keeping highest or lowest 2.
 */
export default class PowerRollDiceField extends SchemaField {

  /**
   * @param {DataFieldOptions} [options]        Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]        Additional context which describes the field.
   */
  constructor(options = {}, context = {}) {
    const fields = {
      mode: new StringField({ choices: ["kh", "kl"], initial: "kh" }),
      number: new NumberField({ required: true, nullable: false, integer: true, initial: 2, min: 1 }),
      faces: new NumberField({ required: true, nullable: false, integer: true, initial: 10, min: 1 }),
    };

    super(fields, { persisted: false, ...options }, context);
  }
}
