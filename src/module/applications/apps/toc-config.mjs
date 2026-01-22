import { systemID, systemPath } from "../../constants.mjs";
import DSApplication from "../api/application.mjs";
import { journal } from "../sheets/_module.mjs";
import DrawSteelCompendiumTOC from "../sidebar/apps/table-of-contents.mjs";

/**
 * @import { ApplicationRenderOptions } from "@client/applications/_types.mjs"
 */

const { createFormGroup, createSelectInput } = foundry.applications.fields;

/**
 * Application for configuring which documents appear in the Table of Contents.
 */
export default class CompendiumTOCConfig extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["standard-form", "toc-config"],
    compendium: null,
    window: {
      resizable: true,
    },
    actions: {
      manageSpecial: this.#manageSpecial,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/toc-config/body.hbs"),
    },
    footer: {
      // Foundry-provided generic template
      template: "templates/generic/form-footer.hbs",
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

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "header":
        break;
      case "body":
        this._prepareBodyContext(context, options);
        break;
      case "footer":
        context.buttons = [{ type: "submit", icon: "fa-solid fa-check", label: "DRAW_STEEL.COMPENDIUM.TOC.configure.submit" }];
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Helper function to prepare the body context.
   * @param {object} context
   * @param {ApplicationRenderOptions} options
   */
  async _prepareBodyContext(context, options) {
    context.entries = this.compendium.contents.sort((a, b) => a.sort - b.sort).map((doc, index) => ({
      document: doc,
      type: doc.getFlag(systemID, "table-of-contents.type") ?? "chapter",
      showPages: doc.getFlag(systemID, "table-of-contents.showPages") ?? true,
      order: doc.getFlag(systemID, "table-of-contents.order") ?? index,
      title: doc.getFlag(systemID, "table-of-contents.title"),
    }));

    context.entryTypes = Object.entries(DrawSteelCompendiumTOC.ENTRY_TYPES).map(([value, { label }]) => ({ value, label }));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.refreshSpecial();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    this.refreshSpecial();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions) {
    const fd = super._processFormData(event, form, formData, submitOptions);

    const updateData = [];

    for (const [_id, data] of Object.entries(fd)) {
      updateData.push({ _id, [CompendiumTOCConfig.flagPath]: data });
    }

    return updateData;
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the visibility of the "manage special" buttons.
   */
  refreshSpecial() {
    for (const journalField of this.element.querySelectorAll("fieldset")) {
      const button = journalField.querySelector("button[data-action='manageSpecial']");

      const typeEntry = journalField.querySelector("select");

      button.classList.toggle("hidden", typeEntry.value !== "special");
    }
  }

  /* -------------------------------------------------- */

  /**
   * Configure the append values for a special page.
   *
   * @this CompendiumTOCConfig
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #manageSpecial(event, target) {
    const { journalId } = target.closest("[data-journal-id]").dataset;

    const specialJournal = this.compendium.get(journalId);

    await this.submit();

    const chapterAppendices = this.config.filter(data => data[CompendiumTOCConfig.flagPath].type === "chapter")
      .sort((a, b) => a[CompendiumTOCConfig.flagPath].order - b[CompendiumTOCConfig.flagPath].order);

    const options = chapterAppendices.map((entry, idx) => {
      const journal = this.compendium.get(entry._id);
      return { label: entry[CompendiumTOCConfig.flagPath].title || journal.name, value: idx };
    });

    const flagPath = "table-of-contents.append";

    const appendChoice = createFormGroup({
      label: "DRAW_STEEL.COMPENDIUM.TOC.FIELDS.append.label",
      hint: "DRAW_STEEL.COMPENDIUM.TOC.FIELDS.append.hint",
      input: createSelectInput({
        options,
        name: "append",
        value: specialJournal.getFlag(systemID, flagPath),
        blank: game.i18n.localize("DRAW_STEEL.COMPENDIUM.TOC.configure.append.blank"),
      }),
      localize: true,
    });

    const content = this.element.ownerDocument.createElement("div");

    content.append(appendChoice);

    const fd = await ds.applications.api.DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.COMPENDIUM.TOC.configure.append.title",
        icon: "fa-solid fa-edit",
      },
    });

    if (fd) {
      await specialJournal.setFlag(systemID, flagPath, fd.append);
    }
  }
}
