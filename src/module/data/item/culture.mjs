import { systemPath } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "culture",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/culture.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Culture"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    const aspectSchema = (aspect) => ({
      aspect: new fields.StringField({choices: ds.CONFIG.culture[aspect]}),
      skillOptions: new fields.SetField(new fields.StringField({blank: false, required: true})),
      skill: new fields.StringField({required: true})
    });

    schema.language = new fields.StringField({required: true});
    schema.environment = new fields.SchemaField(aspectSchema("environment"));
    schema.organization = new fields.SchemaField(aspectSchema("organization"));
    schema.upbringing = new fields.SchemaField(aspectSchema("upbringing"));

    return schema;
  }
}
