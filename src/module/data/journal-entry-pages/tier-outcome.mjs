import { systemID, systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

const { HTMLField } = foundry.data.fields;

/**
 * A page subtype that mostly exists to be used as an embed that has room for three tiers of results.
 */
export default class TierOutcomeModel extends foundry.abstract.TypeDataModel {
  /**
   * Metadata for this JournalEntryPage subtype.
   * @type {SubtypeMetadata}
   */
  static get metadata() {
    return {
      type: "tierOutcome",
      icon: "fa-solid fa-dice-d10",
      embedded: {},
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      tier1: new HTMLField(),
      tier2: new HTMLField(),
      tier3: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.JournalEntryPage.tierOutcome"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options) {
    const context = {
      tier1: await this.powerRollText(1),
      tier2: await this.powerRollText(2),
      tier3: await this.powerRollText(3),
    };

    const wrapper = document.createElement("div");

    wrapper.classList.add(systemID);

    wrapper.innerHTML = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/journal-entry-page/tier-outcome.hbs"), context);

    return wrapper;
  }

  /* -------------------------------------------------- */

  /**
   * Produces the power roll text for a given tier.
   * @param {1 | 2 | 3} tier
   * @returns {Promise<string>} An HTML string.
   */
  async powerRollText(tier) {
    return enrichHTML(this[`tier${tier}`], { relativeTo: this.parent });
  }
}
