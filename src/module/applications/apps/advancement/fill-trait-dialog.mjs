import DSApplication from "../../api/application.mjs";
import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";

/**
 * @import TraitAdvancement from "../../../data/pseudo-documents/advancements/trait-advancement.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 */

/**
 * @typedef FillTraitDialogOptions
 * @property {Set<TraitAdvancement>} advancements
 */

/**
 * An Application that presents unchosen traits, e.g. Languages for "I Speak Their Language".
 */
export default class FillTraitDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & FillTraitDialogOptions} options
   */
  constructor(options) {
    if (!options.advancements) {
      throw new Error("The trait fill dialog was constructed without Chains.");
    }

    super(options);

    this.#advancements = options.advancements;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "fill-trait-{id}",
    classes: ["fill-trait-dialog"],
    window: {
      title: "DRAW_STEEL.ADVANCEMENT.FillTrait.title",
      icon: "fa-solid fa-clipboard-question",
    },
    actions: {
      reconfigureAdvancement: this.#reconfigureAdvancement,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    advancements: {
      template: systemPath("templates/apps/advancement/fill-trait-dialog/advancements.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /**
   * The traits which still have available choices.
   * @type {Set<TraitAdvancement>}
   */
  #advancements;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get advancements() {
    return this.#advancements;
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    /**
     * All advancements should share a common actor and type, so only need to grab the first for that info .
     * @type {TraitAdvancement}
     */
    const sampleAdvancement = options.advancements.first();
    const suffix = sampleAdvancement.document.actor.uuid.replaceAll(".", "-");
    // prevents opening multiple copies of this dialog for a given trait
    options.uniqueId = `${sampleAdvancement.type}-${suffix}`;
    return options;
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
      if (model.description) advancementContext.enrichedDescription = await enrichHTML(model.description, { relativeTo: item });
      items[item.id].advancements.push(advancementContext);
    }

    return { items };
  }

  /* -------------------------------------------------- */

  /**
   * Open the dialog to reconfigure the actor's trait.
   *
   * @this FillTraitDialog
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #reconfigureAdvancement(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    /** @type {TraitAdvancement} */
    const advancement = await fromUuid(uuid);
    await advancement.reconfigure();
  }
}
