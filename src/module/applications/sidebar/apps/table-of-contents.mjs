import { systemID, systemPath } from "../../../constants.mjs";
import CompendiumTOCConfig from "../../apps/toc-config.mjs";

/**
 * An opt-in compendium display that renders a Journal Entry compendium as a Table of Contents.
 */
export default class DrawSteelCompendiumTOC extends foundry.applications.sidebar.apps.Compendium {
  /**
   * Helper function to replace the application class of Journal compendiums with this.
   */
  static applyToPacks() {
    for (const pack of game.packs.filter(p => p.metadata.type === "JournalEntry")) {
      pack.applicationClass = this;
      // if (pack.metadata.flags.display === "table-of-contents") pack.applicationClass = this;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      configureTOC: this.#configureTOC,
    },
    classes: ["draw-steel", "table-of-contents"],
    position: {
      width: 800,
      height: 950,
    },
    window: {
      contentTag: "article",
      controls: [
        {
          action: "configureTOC",
          icon: "fa-solid fa-edit",
          label: "DRAW_STEEL.COMPENDIUM.TOC.configure.action",
          visible: this.#canConfigureTOC,
        },
      ],
      resizable: true,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sidebar/apps/table-of-contents/header.hbs"),
      templates: [],
    },
    contents: {
      template: systemPath("templates/sidebar/apps/table-of-contents/contents.hbs"),
      templates: [],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _createContextMenus() {
    this._createContextMenu(this._getEntryContextOptions, "[data-document-id][data-entry-id]", {
      fixed: true,
      parentClassHooks: false,
      hookName: "getJournalEntryContextOptions",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    // the super call assumes a `directory` part we do not use
    return foundry.utils.deepClone(this.constructor.PARTS);
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const documents = await this.collection.getDocuments();

    // default header
    context.header = {
      title: this.title,
    };

    context.chapters = [];
    const specialEntries = [];
    for (const entry of documents) {
      const flags = entry.flags?.[systemID];
      if (!flags) continue;
      const keys = Object.keys(flags);
      if (flags.tocHidden || !keys.length || ((keys.length === 1) && (keys[0] === "navigation"))) continue;
      const type = flags.type ?? "chapter";

      if (type === "header") {
        const page = entry.pages.contents[0];
        context.header = {
          title: flags.title ?? page?.name,
          content: page?.text.content,
        };
        continue;
      }

      const data = {
        type, flags,
        id: entry.id,
        name: flags.title ?? entry.name,
        pages: Array.from(entry.pages).map(({ flags, id, name, sort }) => ({
          id, sort, flags,
          name: flags[systemID]?.title ?? name,
          entryId: entry.id,
        })),
      };

      if (type === "special") {
        data.showPages = flags.showPages ?? !flags.append;
        specialEntries.push(data);
      } else {
        data.order = (this.constructor.TYPES[type] ?? 200) + (flags.position ?? 0);
        data.showPages = (flags.showPages !== false) && ((flags.showPages === true) || (type === "chapter"));
        context.chapters.push(data);
      }
    }

    context.chapters.sort((lhs, rhs) => lhs.order - rhs.order);
    for (const entry of specialEntries) {
      const append = entry.flags.append;
      const order = entry.flags.order;
      if (append && (append <= context.chapters.length)) {
        context.chapters[append - 1].pages.push({ ...entry, sort: order, entry: true });
      } else {
        context.chapters.push(entry);
      }
    }

    for (const chapter of context.chapters) {
      chapter.pages = chapter.pages
        .filter(p => !p.flags.tocHidden && (chapter.showPages || p.entry))
        .sort((lhs, rhs) => lhs.sort - rhs.sort);
      for (const page of chapter.pages) {
        if (page.pages) page.pages.sort((lhs, rhs) => lhs.sort - rhs.sort);
      }
    }

    return context;
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Include "Configure TOC" in the window controls.
   * @this DrawSteelCompendiumTOC
   */
  static #canConfigureTOC() {
    return !this.collection.locked && this.collection.testUserPermission(game.user, "OWNER");
  }

  /* -------------------------------------------------- */

  /**
   * Configure the display of the journals within this application.
   *
   * @this DrawSteelCompendiumTOC
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #configureTOC(event, target) {
    const fd = await CompendiumTOCConfig.create({ compendium: this.collection });

    getDocumentClass("JournalEntry").updateDocuments(fd, { pack: this.collection.collection });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onClickEntry(event, target) {
    const entryId = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!entryId) return;
    const entry = await this.collection.getDocument(entryId);
    entry?.sheet.render(true, {
      pageId: target.closest("[data-page-id]")?.dataset.pageId,
    });
  }
}
