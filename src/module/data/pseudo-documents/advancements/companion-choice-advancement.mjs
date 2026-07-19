import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";

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
    return [];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext() {}
}
