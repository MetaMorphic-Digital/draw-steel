import { systemID, systemPath } from "../../../constants.mjs";
import CompendiumTOCConfig from "../../apps/toc-config.mjs";

/**
 * @import JournalEntry from "@client/documents/journal-entry.mjs";
 * @import DrawSteelJournalEntryPage from "../../../documents/journal-entry-page.mjs";
 * @import { ChapterContext, PageContext } from "./_types";
 */

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

  /**
   * Valid entry types, as represented by `flags.draw-steel.type`.
   */
  static ENTRY_TYPES = {
    chapter: {
      label: "DRAW_STEEL.COMPENDIUM.TOC.ENTRY_TYPES.chapter",
      order: 0,
    },
    appendix: {
      label: "DRAW_STEEL.COMPENDIUM.TOC.ENTRY_TYPES.appendix",
      order: 100,
    },
    special: {
      label: "DRAW_STEEL.COMPENDIUM.TOC.ENTRY_TYPES.special",
    },
    header: {
      label: "DRAW_STEEL.COMPENDIUM.TOC.ENTRY_TYPES.header",
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
    /** @type {JournalEntry[]} */
    const documents = await this.collection.getDocuments();

    // default header
    context.header = {
      title: this.title,
      cssClass: "hidden",
    };

    /** @type {ChapterContext[]} */
    const chapters = [];
    /** @type {ChapterContext[]} */
    const specialEntries = [];
    for (const entry of documents) {
      /** @type {Record<string, string>} */
      const tocFlags = entry.flags?.[systemID]?.["table-of-contents"];
      if (!tocFlags) continue;
      const keys = Object.keys(tocFlags);
      if (tocFlags.tocHidden || !keys.length || ((keys.length === 1) && (keys[0] === "navigation"))) continue;
      const type = tocFlags.type ?? "chapter";

      if (type === "header") {
        /** @type {DrawSteelJournalEntryPage} */
        const page = entry.pages.contents.sort((a, b) => a.sort - b.sort)[0];
        Object.assign(context.header, {
          title: tocFlags.title || page?.name,
          content: page?.text.content,
          cssClass: "",
        });
        continue;
      }

      const data = {
        type, tocFlags,
        id: entry.id,
        name: tocFlags.title || entry.name,
        pages: Array.from(entry.pages).map(({ flags, id, name, sort, title }) => {
          const tocFlags = flags[systemID]?.["table-of-contents"];

          /** @type {PageContext} */
          const pageData = {
            id, sort, tocFlags, level: title.level,
            name: tocFlags?.title || name,
            entryId: entry.id,
          };

          return pageData;
        }),
      };

      if (type === "special") {
        data.showPages = tocFlags.showPages ?? !tocFlags.append;
        specialEntries.push(data);
      } else {
        data.order = (this.constructor.ENTRY_TYPES[type].order ?? 200) + (tocFlags.position ?? 0);
        data.showPages = (tocFlags.showPages !== false) && ((tocFlags.showPages === true) || (type === "chapter"));
        chapters.push(data);
      }
    }

    chapters.sort((lhs, rhs) => lhs.order - rhs.order);
    for (const entry of specialEntries) {
      const append = entry.tocFlags.append;
      const order = entry.tocFlags.order;
      if (append && (append <= chapters.length)) {
        chapters[append - 1].pages.push({ ...entry, sort: order, entry: true });
      } else {
        chapters.push(entry);
      }
    }

    for (const chapter of chapters) {
      chapter.pages = chapter.pages
        .filter(p => {
          // By default only show level 1 pages & special entries
          const showPage = p.tocFlags?.show ?? p.entry ?? p.level === 1;
          return showPage && (chapter.showPages || p.entry);
        })
        .sort((lhs, rhs) => lhs.sort - rhs.sort);
      for (const page of chapter.pages) {
        if (page.pages) page.pages.sort((lhs, rhs) => lhs.sort - rhs.sort);
      }
    }

    context.chapters = chapters;

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

    await getDocumentClass("JournalEntry").updateDocuments(fd, { pack: this.collection.collection });

    this.render();
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onSearchFilter(event, query, rgx, html) {}
}
