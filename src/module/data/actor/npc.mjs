import BaseActorModel from "./base.mjs";

export default class NPCModel extends BaseActorModel {
  static metadata = Object.freeze({
    type: "npc"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.NPC"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = (initial) => ({initial, required: true, nullable: false, integer: true, min: 0});
    const schema = super.defineSchema();

    schema.negotiation = fields.SchemaField({
      interest: new fields.StringField(requiredInteger(5)),
      patience: new fields.NumberField(requiredInteger(5)),
      motivations: new fields.ArrayField(new fields.StringField({choices: CONFIG.DRAW_STEEL.negotiation.motivations})),
      pitfalls: new fields.ArrayField(new fields.StringField()),
      impression: new fields.NumberField(requiredInteger(1))
    });

    return schema;
  }
}
