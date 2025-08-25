import { systemPath } from "../../constants.mjs";
import { DSDialog, DocumentInput } from "../api/_module.mjs";

/**
 * Simple live-updating input for {@linkcode ds.data.models.SourceModel | `SourceModel`}.
 */
export default class DocumentSourceInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["document-source"],
    window: {
      title: "DRAW_STEEL.SOURCE.Update",
      icon: "fa-solid fa-book",
    },
    actions: {
      clearCompendiumSource: this.#clearCompendiumSource,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/document-input/document-source-input.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /**
   * Fetches source info from module manifests and adds it to CONFIG.DRAW_STEEL.
   * This allows modules that don't otherwise have code to add to the sources.
   * @internal Only run once inside `init` hook.
   */
  static addModuleSources() {
    for (const m of game.modules) {
      if (!m.active) continue;
      const books = foundry.utils.getProperty(m, "flags.draw-steel.books");
      if (books) Object.assign(ds.CONFIG.sourceInfo.books, books);
      const licenses = foundry.utils.getProperty(m, "flags.draw-steel.licenses");
      if (licenses) Object.assign(ds.CONFIG.sourceInfo.licenses, licenses);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.book = {
      options: Object.entries(ds.CONFIG.sourceInfo.books).map(([value, { name }]) => ({ label: name, value })),
      listId: this.document.id + "-bookList",
    };
    context.license = {
      options: Object.entries(ds.CONFIG.sourceInfo.licenses).map(([value, config]) => {
        const opt = { value };
        if (config.name) opt.label = config.name;
        return opt;
      }),
      listId: this.document.id + "-licenseList",
    };
    context.sourceValues = this.document.system.source._source;
    context.sourceFields = this.document.system.source.schema.fields;
    const compendiumSource = await fromUuid(this.document._stats.compendiumSource);
    context.sourceLink = compendiumSource?.toAnchor();
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Clear the document's compendium source.
   * @this {DocumentSourceInput}
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #clearCompendiumSource(event, target) {
    const confirm = await DSDialog.confirm({
      window: {
        title: "DRAW_STEEL.SOURCE.CompendiumSource.ConfirmDeleteTitle",
        icon: "fa-solid fa-triangle-exclamation",
      },
      content: game.i18n.localize("DRAW_STEEL.SOURCE.CompendiumSource.ConfirmDeleteContent"),
    });
    if (confirm) await this.document.update({ "_stats.compendiumSource": null });
  }
}
