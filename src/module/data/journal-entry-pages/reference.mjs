import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import {SubtypeMetadata} from "../_types"
 */

const { HTMLField } = foundry.data.fields;

/**
 * An extensions of a text page that allows for rich tooltips.
 */
export default class ReferenceData extends foundry.abstract.TypeDataModel {
  /**
   * Metadata for this JournalEntryPage subtype.
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
    const enrichedPage = await enrichHTML(this.tooltip || this.parent.text.content, { relativeTo: this.parent });
    const container = document.createElement("div");
    container.innerHTML = enrichedPage;
    return container.children;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
