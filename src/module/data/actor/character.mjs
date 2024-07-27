import {barAttribute} from "./_helpers.mjs";
import BaseActorModel from "./base.mjs";

export default class CharacterModel extends BaseActorModel {
  static metadata = Object.freeze({
    type: "character"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.Character"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = {required: true, nullable: false, integer: true, initial: 0};
    const schema = super.defineSchema();

    schema.hero = new fields.SchemaField({
      // Some classes have a second resource
      resources: barAttribute(10),
      xp: new fields.NumberField(requiredInteger),
      recoveries: barAttribute(8)
    });

    return schema;
  }
}
