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
    const helper = (m, property) => {
      const record = foundry.utils.getProperty(m, `flags.draw-steel.${property}`);
      if (foundry.utils.getType(record) === "Object") {
        for (const [k, v] of Object.entries(record)) {
          if (foundry.utils.getType(v) === "string") ds.CONFIG.sourceInfo[property][k] ??= v;
          else console.warn(`Attempted to register invalid ${property} '${v}' for module '${m.id}'.`);
        }
      } else if (record) {
        console.warn(`The ${property} to register of module '${m.id}' were in invalid format.`);
      }
    };

    for (const m of game.modules) {
      if (!m.active) continue;
      helper(m, "books");
      helper(m, "licenses");
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.book = {
      options: Object.entries(ds.CONFIG.sourceInfo.books).map(([value, { title }]) => ({ label: title, value })),
      listId: this.document.id + "-bookList",
    };
    context.license = {
      options: Object.entries(ds.CONFIG.sourceInfo.licenses).map(([value, { label }]) => ({ label, value })),
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
