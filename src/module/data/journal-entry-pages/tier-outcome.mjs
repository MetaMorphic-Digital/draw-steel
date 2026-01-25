import enrichHTML from "../../utils/enrich-html.mjs";

const { HTMLField } = foundry.data.fields;

/**
 * A page subtype that mostly exists to be used as an embed that has room for three tiers of results.
 */
export default class TierOutcomeModel extends foundry.abstract.TypeDataModel {
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
  async toEmbed(config, options) {
    const dl = document.createElement("dl");
    dl.classList.add("power-roll-display");

    for (const tier of ["tier1", "tier2", "tier3"]) {
      const html = await enrichHTML(this[tier], { relativeTo: this.parent });
      dl.insertAdjacentHTML("beforeend", `<dt class="${tier}">${ds.rolls.PowerRoll.RESULT_TIERS[tier].glyph}</dt><dd>${html}</dd>`);
    }

    return dl;
  }

  /* -------------------------------------------------- */

  /**
   * Produces the power roll text for a given tier.
   * @param {1 | 2 | 3} tier
   * @returns {string} An HTML string.
   */
  async powerRollText(tier) {
    return enrichHTML(this[`tier${tier}`], { relativeTo: this.parent });
  }
}
