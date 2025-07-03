const fields = foundry.data.fields;

export default class BaseCombatantModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Combatant subtype
   */
  static metadata = Object.freeze({
    type: "base",
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Combatant.base"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      disposition: new fields.NumberField({ nullable: true, choices: Object.values(CONST.TOKEN_DISPOSITIONS),
        validationError: "must be a value in CONST.TOKEN_DISPOSITIONS",
      }),
    };
  }
}
