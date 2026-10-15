import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";

/**
 * @import { ActorChoice } from "./_types";
 */

/**
 * An advancement that selects the Beastheart's companion.
 */
export default class CompanionChoiceAdvancement extends ActorChoiceAdvancement {
  /** @inheritdoc */
  static get TYPE() {
    return "companion";
  }

  /* -------------------------------------------------- */

  /**
   * A companion advancement only offers a choice of a single companion.
   * @type {number}
   */
  get chooseN() {
    return 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get actorOptions() {
    /** @type {ActorChoice[]} */
    const options = [];
    for (const pack of game.packs) {
      if (pack.documentName !== "Actor") continue;
      for (const idx of pack.index)
        if (idx.type === "companion") options.push({ uuid: idx.uuid });
    }
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext() {}
}
