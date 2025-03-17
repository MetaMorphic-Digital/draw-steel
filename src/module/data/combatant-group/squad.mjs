import BaseCombatantGroupModel from "./base.mjs";

const fields = foundry.data.fields;

/**
 * A squad is a group of up to eight minions that act together.
 */
export default class SquadModel extends BaseCombatantGroupModel {
  /** @override */
  static metadata = Object.freeze({
    type: "squad",
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.CombatantGroup.squad",
  ];

  static defineSchema() {
    const schema = super.defineSchema();

    return Object.assign(schema, {
      stamina: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
      }),
    });
  }
}
