import AdvancementChain from "../../../utils/advancement-chain.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import DSApplication from "../../api/application.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 */

/**
 * @typedef ChainConfigurationDialogOptions
 * @property {DrawSteelActor} actor
 * @property {AdvancementChain[]} chains
 */

export default class ChainConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & ChainConfigurationDialogOptions} options
   */
  constructor({ chains, actor, ...options } = {}) {
    if (!chains) {
      throw new Error("The chain configuration dialog was constructed without Chains.");
    }
    if (!actor || !(actor.documentName === "Actor") || !(actor.type === "hero")) {
      throw new Error("A chain configuration dialog can only be constructed for heroes.");
    }
    super(options);
    this.#chains = chains;
    this.#hero = actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["chain-configuration-dialog"],
    window: {
      icon: "fa-solid fa-circle-up",
    },
    position: {
      width: 500,
      height: "auto",
    },
    actions: {
      configureAdvancement: ChainConfigurationDialog.#configureAdvancement,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    chains: {
      template: "systems/draw-steel/templates/apps/advancement/chain-configuration-dialog/chains.hbs",
      classes: ["scrollable"],
      scrollable: [""],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * The individual advancement chains. These will be mutated by the application
   * and as such cannot be reused for repeat behavior.
   * @type {AdvancementChain[]}
   */
  #chains;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get chains() {
    return this.#chains;
  }

  /* -------------------------------------------------- */

  /**
   * The hero leveling up.
   * @type {DrawSteelActor}
   */
  #hero;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get hero() {
    return this.#hero;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.ctx = { chains: this.#chains.map(c => c.active()) };
    context.buttons = [{ type: "submit", label: "Confirm", icon: "fa-solid fa-fw fa-check" }];
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preFirstRender(context, options) {
    await super._preFirstRender(context, options);

    for (const chain of this.#chains) {
      chain.enrichedDescription = await enrichHTML(chain.advancement.description, { relativeTo: chain.advancement.document });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Find the node that contains an advancement.
   * @param {string} uuid   The uuid of an advancement.
   * @returns {AdvancementChain|null}
   */
  getByAdvancement(uuid) {
    for (const chain of this.#chains) {
      const node = chain.getByAdvancement(uuid);
      if (node) return node;
    }
    return null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processSubmitData(event, form, formData, submitOptions) {
    // This application has no return value other than us needing to know whether it was dismissed or not.
    return true;
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Configure an advancement, then mutate the chains and re-render.
   * @this {ChainConfigurationDialog}
   * @param {PointerEvent} event          The initiating click event.
   * @param {HTMLButtonElement} target    The capturing HTML element which defined a [data-action].
   */
  static async #configureAdvancement(event, target) {
    const advancementUuid = target.closest("[data-advancement-uuid]").dataset.advancementUuid;
    const node = this.getByAdvancement(advancementUuid);
    const configured = await node.advancement.configureAdvancement(node);
    if (!configured) return;
    this.render();
  }
}
