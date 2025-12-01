const { StringField, HTMLField } = foundry.data.fields;

/**
 * An extensions of a text page that allows for rich tooltips.
 */
export default class ReferenceData extends foundry.abstract.TypeDataModel {
  /**
   * Subtype metadata.
   */
  static metadata = { type: "reference" };

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      short: new StringField({ required: true }),
      long: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    // TODO: Use a custom HTML template.
    const embed = await this.parent.toEmbed({}, {});
    return embed.length ? embed : [embed];
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
