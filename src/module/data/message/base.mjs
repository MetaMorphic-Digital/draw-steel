import DamageRoll from "../../rolls/damage.mjs";

/**
 * A base class for message subtype-specific behavior and data
 */
export default class BaseMessageModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this ChatMessage subtype
   */
  static metadata = Object.freeze({
    type: "base",
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Perform subtype-specific alterations to the final chat message html
   * Called by the renderChatMessageHTML hook
   * @param {HTMLLIElement} html The pending HTML
   */
  async alterMessageHTML(html) {
    const footerButtons = await this._constructFooterButtons();
    if (footerButtons.length) {
      const footer = document.createElement("footer");
      footer.append(...footerButtons);
      html.insertAdjacentElement("beforeend", footer);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Build an array of buttons to insert into the footer of the document
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  async _constructFooterButtons() {
    return [...this._constructDamageFooterButtons()];
  }

  /* -------------------------------------------------- */

  /**
   * Create an array of damage buttons based on each {@linkcode DamageRoll} in this message's rolls.
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  _constructDamageFooterButtons() {
    /** @type {HTMLButtonElement[]} */
    const buttons = [];
    for (let i = 0; i < this.parent.rolls.length; i++) {
      const roll = this.parent.rolls[i];
      if (roll instanceof DamageRoll) buttons.push(roll.toRollButton(i));
    }

    return buttons;
  }

  /* -------------------------------------------------- */

  /**
   * Add event listeners. Guaranteed to run after all alterations in {@linkcode alterMessageHTML}
   * Called by the renderChatMessageHTML hook
   * @param {HTMLLIElement} html The pending HTML
   */
  addListeners(html) {
    const damageButtons = html.querySelectorAll(".apply-damage");
    for (const damageButton of damageButtons) damageButton.addEventListener("click", (event) => DamageRoll.applyDamageCallback(event));
  }
}
