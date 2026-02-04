import { systemID } from "../../constants.mjs";

/**
 * @import JournalEntry from "@client/documents/journal-entry.mjs";
 */

/**
 * Journal Entry sheet class with Draw Steel specific styling.
 */
export default class DrawSteelJournalEntrySheet extends foundry.applications.sheets.journal.JournalEntrySheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (options.parts.includes("pages")) this._injectNavigation(this.document, this.element);
  }

  /* -------------------------------------------------- */

  /**
   * Add navigational controls for journals that define them.
   * @protected
   */
  async _injectNavigation() {
    const nav = this.document.getFlag(systemID, "navigation");
    if (!nav) return;
    const getDocument = id => this.document.pack ? this.document.collection.getDocument(id) : this.document.collection.get(id);
    const previous = nav.previous ? await getDocument(nav.previous) : null;
    const up = nav.up ? await getDocument(nav.up) : null;
    const next = nav.next ? await getDocument(nav.next) : null;
    const element = document.createElement("nav");
    element.classList.add("book-navigation");
    const list = document.createElement("ul");
    element.append(list);
    list.append(this.#makeNavigation(previous, "prev"));
    list.append(this.#makeNavigation(up, "up"));
    list.append(this.#makeNavigation(next, "next"));
    this.element.querySelector(".journal-entry-content .journal-header")?.after(element);
  }

  /* -------------------------------------------------- */

  /**
   * Generate markup for a navigation link.
   * @param {JournalEntry} doc        The journal entry that will be navigated to.
   * @param {"next"|"prev"|"up"} dir  The navigation direction.
   * @returns {HTMLLIElement}
   */
  #makeNavigation(doc, dir) {
    const li = document.createElement("li");
    if (!doc?.testUserPermission(game.user, "OBSERVER")) return li;
    const anchor = document.createElement("a");
    anchor.classList.add("content-link");
    if (dir === "up") anchor.classList.add("parent");
    else {
      anchor.rel = dir;
      anchor.dataset.tooltipDirection = dir === "prev" ? "LEFT" : "RIGHT";
    }
    const i18n = { prev: "Previous", next: "Next", up: "Up" };
    Object.assign(anchor.dataset, { link: "", tooltip: `DRAW_STEEL.JournalEntry.Navigation.${i18n[dir]}`, uuid: doc.uuid });
    anchor.append(doc.name);
    li.append(anchor);
    return li;
  }
}
