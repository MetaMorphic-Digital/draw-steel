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
      options: new fields.SetField(new fields.StringField({blank: false, required: true})),
      count: new fields.NumberField(),
      choices: new fields.SetField(new fields.StringField({blank: false, required: true}))
    });

    schema.languages = new fields.SchemaField({
      options: new fields.SetField(new fields.StringField({blank: false, required: true})),
      count: new fields.NumberField(),
      choices: new fields.SetField(new fields.StringField({blank: false, required: true}))
    });

    schema.renown = new fields.NumberField();

    schema.projectPoints = new fields.NumberField();

    schema.title = new fields.SchemaField({
      grant: new fields.DocumentUUIDField({type: "Item", embedded: false}),
      link: new fields.DocumentUUIDField({type: "Item", embedded: true})
    });

    return schema;
  }

  getSheetContext(context) {
    context.skillOptions = ds.CONFIG.skills.optgroups.filter(skill => this.skills.options.has(skill.value))
    context.languageOptions = [] // ds.CONFIG.languages.optgroups.filter(lang => this.languages.options.has(lang))
  }
}
