const fields = foundry.data.fields;

/**
 * Baseline model for Combatant Group subtype-specific behavior
 */
export default class BaseCombatantGroupModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this CombatantGroup subtype
   */
  static metadata = Object.freeze({
    type: "base",
  });

  /** @inheritdoc */
  static defineSchema() {
    return {
      initiative: new fields.NumberField({ required: true, label: "COMBAT.CombatantInitiative" }),
    };
  }

  activate() {
    console.log("Activating ", this.parent.name);
  }
}
