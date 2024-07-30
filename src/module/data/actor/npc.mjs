import {requiredInteger} from "./_helpers.mjs";
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
    const schema = super.defineSchema();
    const config = CONFIG.DRAW_STEEL;

    schema.negotiation = new fields.SchemaField({
      interest: requiredInteger(5),
      patience: requiredInteger(5),
      motivations: new fields.ArrayField(new fields.StringField({choices: config.negotiation.motivations})),
      pitfalls: new fields.ArrayField(new fields.StringField()),
      impression: requiredInteger(1)
    });

    schema.monster = new fields.SchemaField({
      keywords: new fields.SetField(new fields.StringField({blank: true, required: true})),
      ev: requiredInteger(4),
      role: new fields.StringField({choices: config.monsters.roles}),
      subrole: new fields.StringField({choices: config.monsters.subroles})
    });

    return schema;
  }
}
