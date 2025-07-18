import QueryManager from "./query-manager.mjs";

/** @import DrawSteelUser from "../../documents/user.mjs" */

/**
 * A stock class for delegating rolls.
 * @template {boolean | number} QueryResult The roll "product" (evaluated result).
 * @extends QueryManager<QueryResult>
 * @abstract
 */
export default class RollManager extends QueryManager {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["roll-manager"],
    window: {
      icon: "fa-solid fa-dice-d10",
    },
    actions: {
      roll: this.#roll,
    },
  };

  /* -------------------------------------------------- */

  /**
   * Handle a click on a roll button.
   * @this RollManager
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #roll(event, target) {
    const user = game.users.get(target.closest("[data-user-id]").dataset.userId);

    return this._handleRoll(user, target);
  }

  /* -------------------------------------------------- */

  /**
   * Subclass-specific logic for what the roll should be.
   * @param {DrawSteelUser} user   The draw steel user performing the roll.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @abstract
   * @protected
   */
  async _handleRoll(user, target) {}
}
