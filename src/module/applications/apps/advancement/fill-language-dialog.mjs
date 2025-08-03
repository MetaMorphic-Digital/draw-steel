import DSApplication from "../../api/application.mjs";
import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";

/**
 * @import LanguageAdvancement from "../../../data/pseudo-documents/advancements/language-advancement.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 */

/**
 * @typedef FillLanguageDialogOptions
 * @property {Set<LanguageAdvancement>} advancements
 */

/**
 * An Application that presents unchosen languages for the purpose of "I Speak Their Language".
 */
export default class FillLanguageDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & FillLanguageDialogOptions} options
   */
  constructor({ advancements, ...options }) {
    if (!advancements) {
      throw new Error("The language fill dialog was constructed without Chains.");
    }

    super(options);

    this.#advancements = advancements;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["fill-language-dialog"],
    window: {
      title: "DRAW_STEEL.ADVANCEMENT.ISpeakTheirLanguage.title",
      icon: "fa-solid fa-comment",
    },
    actions: {
      reconfigureAdvancement: this.#reconfigureAdvancement,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    advancements: {
      template: systemPath("templates/apps/advancement/fill-language-dialog/advancements.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /**
   * The languages which still have available choices.
   * @type {Set<LanguageAdvancement>}
   */
  #advancements;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get advancements() {
    return this.#advancements;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const items = {};
    for (const model of this.advancements) {

      const item = model.document;
      items[item.id] ??= {
        name: item.name,
        advancements: [],
      };

      const advancementContext = {
        name: model.name,
        img: model.img,
        uuid: model.uuid,
      };
      if (model.description) advancementContext.enrichedDescription = await enrichHTML(model.description, { relativeTo: this.document });
      items[item.id].advancements.push(advancementContext);
    }

    return { items };
  }

  /* -------------------------------------------------- */

  /**
   * Open the dialog to reconfigure the actor's language.
   *
   * @this FillLanguageDialog
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #reconfigureAdvancement(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    /** @type {LanguageAdvancement} */
    const advancement = await fromUuid(uuid);
    await advancement.reconfigure();
  }
}
