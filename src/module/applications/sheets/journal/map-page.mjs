/**
 * Journal entry page that displays a controls for editing map markers.
 */
export default class MapLocationPage extends foundry.applications.sheets.journal.JournalEntryPageProseMirrorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "text", "map"],
  };

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const code = this.document.system.code ?? "";

    if (this.isView) {
      const title = this.element.querySelector(".journal-page-header :first-child");
      if (title) title.dataset.mapLocationCode = code;
    } else {
      const header = this.element.querySelector(".journal-header");
      const name = header.querySelector("input");
      const div = document.createElement("div");
      const input = document.createElement("input");
      Object.assign(input, { name: "system.code", type: "text", value: code });
      div.append(input, name);
      header.insertAdjacentElement("afterbegin", div);
    }
  }
}
