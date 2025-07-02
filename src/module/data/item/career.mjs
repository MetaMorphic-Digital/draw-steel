import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Careers describe what a hero did for a living before becoming a hero
 */
export default class CareerModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "career",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/item/partials/career.hbs")],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Career",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.projectPoints = new fields.NumberField({ integer: true, required: true });
    schema.renown = new fields.NumberField({ integer: true, required: true });
    schema.wealth = new fields.NumberField({ integer: true, required: true });

    return schema;
  }
}
