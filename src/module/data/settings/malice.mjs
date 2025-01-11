
const fields = foundry.data.fields;

/**
 * A data model to manage Malice in Draw Steel
 */
export class MaliceModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new fields.NumberField({nullable: false, initial: 0, integer: true})
    };
  }

  /** Name for the setting */
  static label = "DRAW_STEEL.Setting.Malice.Label";

  /** Helper text for Hero Tokens */
  static hint = "DRAW_STEEL.Setting.Malice.Hint";
}
