import {systemID} from "../../constants.mjs";
import {requiredInteger, setOptions} from "../helpers.mjs";
import BaseActorModel from "./base.mjs";
/** @import {MaliceModel} from "../settings/_module.mjs"; */

/**
 * NPCs are created and controlled by the director
 */
export default class NPCModel extends BaseActorModel {
  /** @override */
  static metadata = Object.freeze({
    type: "npc"
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.NPC"
  ];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.negotiation = new fields.SchemaField({
      interest: requiredInteger({initial: 5}),
      patience: requiredInteger({initial: 5}),
      motivations: new fields.SetField(setOptions()),
      pitfalls: new fields.SetField(setOptions()),
      impression: requiredInteger({initial: 1})
    });

    schema.monster = new fields.SchemaField({
      keywords: new fields.SetField(setOptions()),
      level: requiredInteger({initial: 1}),
      ev: requiredInteger({initial: 4}),
      role: new fields.StringField({required: true, nullable: false}),
      organization: new fields.StringField({required: true, nullable: false})
    });

    return schema;
  }

  /** @override */
  get level() {
    return this.monster.level;
  }

  /** @override */
  get coreResource() {
    return {
      name: game.i18n.localize("DRAW_STEEL.Setting.Malice.Label"),
      /** @type {MaliceModel} */
      target: game.settings.get(systemID, "malice"),
      path: "value"
    };
  }

  /** @override */
  async updateResource(delta) {
    if (!game.user.isGM) throw new Error("Malice can only be updated by a GM");
    /** @type {MaliceModel} */
    const malice = game.settings.get(systemID, "malice");
    game.settings.set(systemID, "malice", {value: malice.value + delta});
  }
}
