const { StringField } = foundry.data.fields;

/**
 * An extension of the core Image page data with advanced alt text capabilities as art descriptions.
 */
export default class DrawSteelImageData extends foundry.abstract.TypeDataModel {
  /**
   * Metadata for this JournalEntryPage subtype.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return { type: "image" };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat(["DRAW_STEEL.JournalEntryPage.image"]);

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      artDescription: new StringField({ required: true }),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    config.alt ??= this.artDescription;

    return this.parent._embedImagePage(config, options);
  }
}
