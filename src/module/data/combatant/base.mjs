const fields = foundry.data.fields;

export default class BaseCombatantModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({
    type: "base"
  });

  /** @override */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Combatant.base"];

  /** @override */
  static defineSchema() {
    return {
      disposition: new fields.NumberField({nullable: true, choices: Object.values(CONST.TOKEN_DISPOSITIONS),
        validationError: "must be a value in CONST.TOKEN_DISPOSITIONS"
      })
    };
  }
}