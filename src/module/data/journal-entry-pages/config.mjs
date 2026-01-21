const { ArrayField, DocumentUUIDField, SchemaField, StringField } = foundry.data.fields;

/**
 * A journal page for easy registration of configuration data like monster keywords.
 */
export default class ConfigurationModel extends foundry.abstract.TypeDataModel {
  /**
   * Metadata for this JournalEntryPage subtype.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return {
      type: "configure",
      icon: "fa-solid fa-spaghetti-monster-flying",
      embedded: {},
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const entryList = (additionalEntries = {}) => {
      return new ArrayField(new SchemaField({
        label: new StringField({ required: true }),
        key: new StringField({ blank: false, validate: string => {
          return; // TODO:
        } }),
        ...additionalEntries,
      }));
    };

    return {
      languages: entryList(),
      monsterKeywords: entryList({ reference: new DocumentUUIDField({ type: "JournalEntryPage" }) }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.JournalEntryPage.config"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
