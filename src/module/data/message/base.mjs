
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
   * Called by the renderChatMessage hook
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
   * A helper method for constructing an HTML button based on given parameters.
   * @param {object} [config={}]
   * @param {string} [config.label=""]
   * @param {object} [config.dataset={}]
   * @param {string[]} [config.classes=[]]
   * @param {string} [config.icon=""]
   * @returns {HTMLButtonElement}
   * @protected
   */
  _constructButton({label = "", dataset = {}, classes = [], icon = ""} = {}) {
    const button = document.createElement("button");

    for (const [key, value] of Object.entries(dataset)) {
      button.dataset[key] = value;
    }
    button.classList.add(...classes);
    if (icon) icon = `<i class="${icon}"></i> `;
    button.innerHTML = `${icon}${label}`;

    return button;
  }

  /**
   * Add event listeners. Guaranteed to run after all alterations in {@link alterMessageHTML}
   * Called by the renderChatMessage hook
   * @param {HTMLLIElement} html The pending HTML
   */
  addListeners(html) {}
}
