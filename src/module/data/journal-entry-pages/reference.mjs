/**
 * @import {SubtypeMetadata} from "../_types"
 */

const { HTMLField } = foundry.data.fields;

/**
 * An extensions of a text page that allows for rich tooltips.
 */
export default class ReferenceData extends foundry.abstract.TypeDataModel {
  /**
   * Subtype metadata.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return {
      type: "reference",
      icon: "fa-solid fa-notebook",
      embedded: {},
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      tooltip: new HTMLField({ required: true }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.JournalEntryPage.reference"];

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

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
