
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

  /** Localized name for the setting */
  get label() {
    return game.i18n.localize(this.constructor.label);
  }

  /** Helper text for Malice */
  static hint = "DRAW_STEEL.Setting.Malice.Hint";

  /** Localized helper text for Malice */
  get hint() {
    return game.i18n.localize(this.constructor.hint);
  }
}
