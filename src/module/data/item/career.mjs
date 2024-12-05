import { systemPath } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Careers describe what a hero did for a living before becoming a hero
 */
export default class CareerModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "career",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/career.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Career"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.skills = new fields.SchemaField({
      options: new fields.SetField(new fields.StringField({choices: this.skillOptions})),
      count: new fields.NumberField(),
      choices: new fields.SetField(new fields.StringField({blank: true, required: true, choices: this.skillChoice}))
    });

    schema.languages = new fields.SchemaField({
      options: new fields.SetField(new fields.StringField({choices: this.languageOptions})),
      count: new fields.NumberField(),
      choices: new fields.SetField(new fields.StringField({blank: true, required: true, choices: this.languageChoice}))
    });

    schema.renown = new fields.NumberField();

    schema.projectPoints = new fields.NumberField();

    schema.title = new fields.SchemaField({
      grant: new fields.DocumentUUIDField(),
      link: new fields.DocumentUUIDField()
    });

    return schema;
  }
}
