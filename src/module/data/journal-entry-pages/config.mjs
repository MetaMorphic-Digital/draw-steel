const { ArrayField, SchemaField, StringField } = foundry.data.fields;

/**
 * A journal page for easy registration of configuration data like monster keywords.
 */
export default class ConfigData extends foundry.abstract.TypeDataModel {
  /**
   * Metadata for this JournalEntryPage subtype.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return {
      type: "config",
      icon: "fa-solid fa-spaghetti-monster-flying",
      embedded: {},
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      monsterKeywords: new ArrayField(new SchemaField({
        label: new StringField({ required: true }),
        key: new StringField({ blank: false }),
      })),
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
