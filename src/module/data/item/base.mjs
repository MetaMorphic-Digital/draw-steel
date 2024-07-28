export default class BaseItemModel extends foundry.abstract
  .TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.SchemaField({
      value: new fields.HTMLField(),
      gm: new fields.HTMLField()
    });

    schema.source = new fields.SchemaField({
      book: new fields.StringField(),
      page: new fields.StringField(),
      license: new fields.StringField()
    });

    /**
     * The Draw Steel ID, indicating a unique game rules element
     */
    schema._dsid = new fields.StringField();

    return schema;
  }

  /**
   * Valid languages and language groupings in Draw Steel
   * @returns {Record<string, string>} A record of languages and language groups with their labels
   */
  static languageOptions() {
    return {};
  }

  /**
   * Valid languages in Draw Steel
   * @returns {Record<string, string>} Languages and their labels
   */
  static languageChoice() {
    return {};
  }

  /**
   * Valid skills and skill groupings in Draw Steel
   * @returns {Record<string, string>} A record of skills and skill groups with their labels
   */
  static skillOptions() {
    return {};
  }

  /**
   * Valid skills in Draw Steel
   * @returns {Record<string, string>} Skills and their labels
   */
  static skillChoice() {
    return {};
  }
}
