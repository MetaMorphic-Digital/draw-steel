import DrawSteelCompendiumBrowser from "../../apps/compendium-browser.mjs";

/**
 * A custom Compendium Directory.
 */
export default class DrawSteelCompendiumDirectory extends foundry.applications.sidebar.tabs.CompendiumDirectory {
  static DEFAULT_OPTIONS = {
    actions: {
      openCompendiumBrowser: this.#openCompendiumBrowser,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const headerActions = this.element.querySelector("header .header-actions");
    headerActions.insertAdjacentElement("beforeend", ds.utils.constructHTMLButton({
      label: _loc("DRAW_STEEL.COMPENDIUM.BROWSER.title"),
      icon: DrawSteelCompendiumBrowser.DEFAULT_OPTIONS.window.icon,
      dataset: {
        action: "openCompendiumBrowser",
      },
    }));
  }

  /* -------------------------------------------------- */

  /**
   * Open the compendium browser.
   * @this DrawSteelCompendiumDirectory
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #openCompendiumBrowser(event, target) {
    new DrawSteelCompendiumBrowser().render({ force: true });
  }
}
