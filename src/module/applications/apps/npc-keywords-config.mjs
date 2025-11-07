import { systemID, systemPath } from "../../constants.mjs";

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * Configuration menu for managing NPC keywords.
 */
export default class NPCKeywordsConfig extends HandlebarsApplicationMixin(Application) {
  /**
   * Local state for keywords being edited.
   * @type {Set<string>}
   */
  #keywords = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "npc-keywords-config",
    classes: ["draw-steel", "npc-keywords-config"],
    tag: "form",
    window: {
      title: "DRAW_STEEL.Setting.NPCKeywords.Label",
      icon: "fa-solid fa-tags",
    },
    position: {
      width: 500,
      height: "auto",
    },
    form: {
      handler: NPCKeywordsConfig.prototype._onSubmit,
      closeOnSubmit: false,
      submitOnChange: false,
    },
    actions: {
      addKeyword: NPCKeywordsConfig.prototype._onAddKeyword,
      deleteKeyword: NPCKeywordsConfig.prototype._onDeleteKeyword,
      resetKeywords: NPCKeywordsConfig.prototype._onResetKeywords,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    form: {
      template: systemPath("templates/apps/npc-keywords-config.hbs"),
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Initialize keywords from settings on first render
    if (options.isFirstRender) {
      const keywordsSet = game.settings.get(systemID, "npcKeywords");
      this.#keywords = new Set(keywordsSet);
    }

    // Use local state for display
    context.keywords = Array.from(this.#keywords).sort();

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === "footer") {
      context.buttons = [
        {
          type: "button",
          action: "resetKeywords",
          label: "DRAW_STEEL.Setting.NPCKeywords.Reset",
          icon: "fa-solid fa-rotate-left",
        },
        {
          type: "submit",
          label: "DRAW_STEEL.Setting.NPCKeywords.SaveChanges",
          icon: "fa-solid fa-save",
        },
      ];
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Add Enter key support for the input field
    const input = this.element.querySelector("input[name=\"newKeyword\"]");
    if (input) {
      input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const addButton = this.element.querySelector("button[data-action=\"addKeyword\"]");
          if (addButton) addButton.click();
        }
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle adding a new keyword.
   * @param {PointerEvent} event     The originating click event.
   * @param {HTMLElement} target     The button element.
   */
  async _onAddKeyword(event, target) {
    const input = this.element.querySelector("input[name=\"newKeyword\"]");
    const keyword = input.value.trim();

    if (!keyword) {
      ui.notifications.warn(game.i18n.localize("DRAW_STEEL.Setting.NPCKeywords.EmptyKeyword"));
      return;
    }

    // Check if keyword already exists in local state
    if (this.#keywords.has(keyword)) {
      ui.notifications.warn(game.i18n.format("DRAW_STEEL.Setting.NPCKeywords.DuplicateKeyword", { keyword }));
      return;
    }

    // Add the new keyword to local state
    this.#keywords.add(keyword);

    // Clear input and re-render
    input.value = "";
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle deleting a keyword.
   * @param {PointerEvent} event     The originating click event.
   * @param {HTMLElement} target     The button element.
   */
  async _onDeleteKeyword(event, target) {
    const keyword = target.closest("[data-keyword]").dataset.keyword;

    // Remove from local state
    this.#keywords.delete(keyword);

    // Re-render
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle resetting all keywords.
   * @param {PointerEvent} event     The originating click event.
   * @param {HTMLElement} target     The button element.
   */
  async _onResetKeywords(event, target) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("DRAW_STEEL.Setting.NPCKeywords.ResetConfirmTitle") },
      content: `<p>${game.i18n.localize("DRAW_STEEL.Setting.NPCKeywords.ResetConfirmContent")}</p>`,
      yes: { label: game.i18n.localize("DRAW_STEEL.Setting.NPCKeywords.Reset") },
    });

    if (!confirmed) return;

    // Clear all keywords from local state
    this.#keywords.clear();

    // Re-render
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle form submission.
   * @param {SubmitEvent} event           The form submission event.
   * @param {HTMLFormElement} form        The submitted form.
   * @param {FormDataExtended} formData   Processed form data.
   */
  async _onSubmit(event, form, formData) {
    // Save keywords to settings
    const keywordsArray = Array.from(this.#keywords);
    await game.settings.set(systemID, "npcKeywords", keywordsArray);

    // Start by deleting all previously registered settings-origin keywords
    for (const entry of Object.entries(ds.CONFIG.monsters.keywords)) {
      const [_, group] = entry;
      if (group === "DRAW_STEEL.Actor.npc.KeywordGroups.General") {
        foundry.utils.deleteProperty(ds.CONFIG.monsters.keywords, entry);
      }
    }

    // Re-register the full set of keywords
    for (const keyword of keywordsArray) {
      foundry.utils.setProperty(ds.CONFIG.monsters.keywords, keyword, {
        label: keyword,
        group: game.i18n.localize("DRAW_STEEL.Actor.npc.KeywordGroups.Settings"),
      });
    }

    // Close the application
    this.close();
  }
}

/*
 * Populate initial keywords from settings into ds.CONFIG on ready
 */
Hooks.once("ready", async function () {
  const keywordsSet = game.settings.get(systemID, "npcKeywords");
  for (const keyword of keywordsSet) {
    foundry.utils.setProperty(ds.CONFIG.monsters.keywords, keyword, {
      label: keyword,
      group: game.i18n.localize("DRAW_STEEL.Actor.npc.KeywordGroups.Settings"),
    });
  }
});
