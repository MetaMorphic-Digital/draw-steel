import BaseItemModel from "./base.mjs";

export default class CultureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "culture"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Culture"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    const aspectSchema = (aspect) => ({
      aspect: new fields.StringField({choices: CONFIG.DRAW_STEEL.culture[aspect]}),
      skillOptions: new fields.SetField(new fields.StringField({choices: this.skillOptions})),
      skill: new fields.StringField({blank: true, required: true, choices: this.skillChoice})
    });

    schema.language = new fields.StringField({blank: true, required: true, choices: this.languageChoice});
    schema.environment = new fields.SchemaField(aspectSchema("environment"));
    schema.organization = new fields.SchemaField(aspectSchema("organization"));
    schema.upbringing = new fields.SchemaField(aspectSchema("upbringing"));

    return schema;
  }
}
