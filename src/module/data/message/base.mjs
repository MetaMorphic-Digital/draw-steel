
/**
 * A base class for message subtype-specific behavior and data
 */
export default class BaseMessageModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this ChatMessage subtype
   */
  static metadata = Object.freeze({
    type: "base"
  });

  static defineSchema() {
    return {};
  }

  /**
   * Perform subtype-specific alterations to the final chat message html
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

  /**
   * Build an array of buttons to insert into the footer of the document
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  async _constructFooterButtons() {
    return [];
  }

  /**
   * Add event listeners
   * @param {HTMLLIElement} html The pending HTML
   */
  addListeners(html) {}
}
