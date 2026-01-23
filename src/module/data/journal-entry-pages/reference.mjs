import { systemID, systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import {SubtypeMetadata} from "../_types"
 */

const { HTMLField, StringField } = foundry.data.fields;

/**
 * An extensions of a text page that allows for rich tooltips.
 */
export default class ReferenceModel extends foundry.abstract.TypeDataModel {
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
      category: new StringField({ blank: false }),
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
    const tooltipHTML = await enrichHTML(this.tooltip || this.parent.text.content, { relativeTo: this.parent });

    const journal = this.parent.parent;
    const category = journal.categories.get(this.parent.category);

    const context = {
      tooltipHTML,
      page: this.parent,
      categoryLabel: this.category ?? category?.name,
    };

    const container = document.createElement("div");

    const content = await foundry.applications.handlebars.renderTemplate(systemPath("templates/sheets/journal/pages/reference/rich-tooltip.hbs"), context);

    container.innerHTML = content;
    return container.children;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
