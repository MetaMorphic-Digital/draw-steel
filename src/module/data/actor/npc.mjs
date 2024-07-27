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
    const requiredInteger = {required: true, nullable: false, integer: true};
    const schema = super.defineSchema();

    return schema;
  }
}
