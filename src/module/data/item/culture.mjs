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

    const aspectSchema = (aspect) => {
      const options = CONFIG.DRAW_STEEL.culture[aspect];

      return {
        aspect: new fields.StringField({choices: Object.entries(options).reduce(acc, [key, value])}),
        skillOptions: new fields.SetField(new fields.StringField({choices: this.skillOptions})),
        skill: new fields.StringField({blank: true, required: true, choices: this.skillChoice})
      };
    };

    schema.language = new fields.StringField({blank: true, required: true, choices: this.languageChoice});
    schema.environment = new fields.SchemaField(aspectSchema());
    schema.organization = new fields.SchemaField(aspectSchema());
    schema.upbringing = new fields.SchemaField(aspectSchema());

    return schema;
  }
}
