import { systemID, systemPath } from "../../constants.mjs";
import DrawSteelCompendiumTOC from "../sidebar/apps/table-of-contents.mjs";

/**
 * @import { ApplicationRenderOptions } from "@client/applications/_types.mjs"
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * Application for configuring which documents appear in the Table of Contents.
 */
export default class CompendiumTOCConfig extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "toc-config-{id}",
    classes: ["draw-steel", "toc-config"],
    compendium: null,
    position: {
      width: 450,
      height: "auto",
    },
    tag: "form",
    form: {
      submitOnChange: true,
      handler: CompendiumTOCConfig.#submitHandler,
    },
    window: {
      icon: "fa-solid fa-table-columns",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/toc-config/body.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /**
   * The data path for flags used in the TOC application.
   * @type {string}
   */
  static get flagPath() {
    return `flags.${systemID}.table-of-contents`;
  }

  /* -------------------------------------------------- */

  /**
   * The compendium being configured.
   * @type {foundry.documents.collections.CompendiumCollection}
   */
  get compendium() {
    return this.options.compendium;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.COMPENDIUM.TOC.configure.title", { title: game.i18n.localize(this.compendium.title) });
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = options.compendium.collection.replaceAll(".", "_");
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.rootId = this.id;

    context.entries = this.compendium.contents.sort((a, b) => a.sort - b.sort).map((doc, index) => ({
      document: doc,
      type: doc.getFlag(systemID, "table-of-contents.type") ?? "chapter",
      showPages: doc.getFlag(systemID, "table-of-contents.showPages") ?? true,
      order: doc.getFlag(systemID, "table-of-contents.order") ?? index,
      title: doc.getFlag(systemID, "table-of-contents.title"),
      append: doc.getFlag(systemID, "table-of-contents.append"),
    }));

    context.chapterOptions = context.entries.filter(e => e.type === "chapter").map(e => ({ value: e.document.id, label: e.document.name }));

    context.entryTypes = Object.entries(DrawSteelCompendiumTOC.ENTRY_TYPES).map(([value, { label }]) => ({ value, label }));

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.compendium.apps.push(this);
  }

  /* -------------------------------------------------- */

  /**
   * Update documents in this collection by the bundled form data.
   * @this CompendiumTOCConfig
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   * @param {object} [submitOptions]      Additional info potentially forwarded by {@link Application#submit}.
   */
  static async #submitHandler(event, form, formData, submitOptions = {}) {
    const fd = foundry.utils.expandObject(formData.object);

    const updateData = [];

    for (const [_id, data] of Object.entries(fd)) {
      updateData.push({ _id, [CompendiumTOCConfig.flagPath]: data });
    }

    await getDocumentClass("JournalEntry").updateDocuments(updateData, { pack: this.compendium.collection });

    // Also includes this application
    this.compendium.render();
  }
}
