import {systemPath} from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Careers describe what a hero did for a living before becoming a hero
 */
export default class CareerModel extends AdvancementModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "career",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/career.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Career"
  ];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.renown = new fields.NumberField({integer: true});
    schema.projectPoints = new fields.NumberField({integer: true});

    return schema;
  }
}
