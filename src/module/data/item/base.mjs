export default class BaseItemModel extends foundry.abstract
  .TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.SchemaField({
      value: new fields.HTMLField(),
      gm: new fields.HTMLField()
    });

    return schema;
  }
}
