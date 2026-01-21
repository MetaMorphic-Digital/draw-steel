/**
 * A class responsible for orchestrating tooltips in the system.
 */
export default class DrawSteelTooltipManager extends foundry.helpers.interaction.TooltipManager {
  /**
   * The currently registered observer.
   * @type {MutationObserver}
   */
  #observer;

  /* -------------------------------------------------- */

  /**
   * Helper handlebars helper to create a `data-tooltip-html` property.
   * @example <div data-tooltip-html="{{ds-tooltip uuid=item.uuid}}"></div>
   * @example <div data-tooltip-html="{{ds-tooltip identifier='checks'}}"></div>
   * @param {object} options
   * @returns {string}
   */
  static handlebarsHelper(options) {
    return DrawSteelTooltipManager.constructHTML(options.hash);
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to construct tooltip HTML.
   * @param {object} options
   * @returns {string}
   */
  static constructHTML(options) {
    const uuid = options.uuid
      ? options.uuid
      : ds.CONFIG.references[options.identifier];
    if (!uuid) return "";

    return `<section>
      <i class="fa-solid fa-spinner fa-spin-pulse loading" data-uuid="${uuid}"></i>
    </section>`;
  }

  /* -------------------------------------------------- */
  /*  Methods                                           */
  /* -------------------------------------------------- */

  /**
   * Initialize the mutation observer.
   */
  observe() {
    this.#observer?.disconnect();
    this.#observer = new MutationObserver(this._onMutation.bind(this));
    this.#observer.observe(this.tooltip, { attributeFilter: ["class"], attributeOldValue: true });
  }

  /* -------------------------------------------------- */

  /**
   * Handle a mutation event.
   * @param {MutationRecord[]} mutationList  The list of changes.
   * @protected
   */
  _onMutation(mutationList) {
    let isActive = false;
    const tooltip = this.tooltip;
    for (const { type, attributeName, oldValue } of mutationList) {
      if ((type === "attributes") && (attributeName === "class")) {
        const difference = new Set(tooltip.classList).difference(new Set(oldValue?.split(" ")));
        if (difference.has("active")) isActive = true;
      }
    }
    if (isActive) this._onTooltipActivate();
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve an item via uuid when hovering over a loading tooltip,
   * or replace the tooltip of a JournalEntryPage.
   */
  async _onTooltipActivate() {
    let document;
    if (this.element?.classList.contains("content-link")) {
      document = await fromUuid(this.element.dataset.uuid);
    } else {
      const loading = this.tooltip.querySelector(".loading")?.dataset.uuid;
      document = await fromUuid(loading);
    }

    if (document) this._onHoverDocument(document);
  }

  /* -------------------------------------------------- */

  /**
   * Handle hovering over a document or custom tooltip and showing rich tooltips if possible.
   * @param {foundry.abstract.Document} doc   The document.
   */
  async _onHoverDocument(doc) {
    let content = (typeof doc.richTooltip === "function")
      ? doc.richTooltip()
      : (typeof doc.system?.richTooltip === "function")
        ? doc.system.richTooltip()
        : null;

    if (content === null) return;

    content = await content;
    if (!content?.length) return;

    this.tooltip.replaceChildren(...content);
    this.tooltip.classList.add(game.system.id);
    requestAnimationFrame(() => this._positionItemTooltip());
  }

  /* -------------------------------------------------- */

  /**
   * Position a tooltip after rendering.
   * @param {string} [direction]    The direction to position the tooltip.
   * @protected
   */
  _positionItemTooltip(direction) {
    const Cls = this.constructor;

    if (!direction) {
      direction = Cls.TOOLTIP_DIRECTIONS.LEFT;
      this._setAnchor(direction);
    }

    const pos = this.tooltip.getBoundingClientRect();
    const dirs = Cls.TOOLTIP_DIRECTIONS;
    switch (direction) {
      case dirs.UP:
        if (pos.y - Cls.TOOLTIP_MARGIN_PX <= 0) direction = dirs.DOWN;
        break;
      case dirs.DOWN:
        if (pos.y + this.tooltip.offsetHeight > window.innerHeight) direction = dirs.UP;
        break;
      case dirs.LEFT:
        if (pos.x - Cls.TOOLTIP_MARGIN_PX <= 0) direction = dirs.RIGHT;
        break;
      case dirs.RIGHT:
        if (pos.x + this.tooltip.offsetWidth > window.innerWidth) direction = dirs.LEFT;
        break;
    }

    this._setAnchor(direction);
  }
}
