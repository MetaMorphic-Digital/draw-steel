import enrichHTML from "../../../utils/enrich-html.mjs";
import DSApplication from "../../api/application.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 * @import {AdvancementChain, AdvancementNode} from "../../../utils/advancement/_module.mjs";
 * @import { ApplicationConfiguration, ApplicationRenderContext, ApplicationRenderOptions } from "@client/applications/_types.mjs";
 */

/**
 * @typedef ChainConfigurationDialogOptions
 * @property {AdvancementChain} chains
 */

export default class ChainConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & ChainConfigurationDialogOptions} options
   */
  constructor({ chain, ...options } = {}) {
    if (!chain) {
      throw new Error("The chain configuration dialog was constructed without Chains.");
    }
    super(options);
    Object.defineProperty(this, "chain", { value: chain, writable: false, configurable: false });
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
   * The advancement chain this dialog is modifying.
   * @type {AdvancementChain}
   */
  chain;

  /* -------------------------------------------------- */

  /**
   * The actor leveling up.
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.chain.actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "chains":
        await this._prepareChainContext(context, options);
        break;
      case "footer":
        context.buttons = [{ type: "submit", label: "Confirm", icon: "fa-solid fa-fw fa-check" }];
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   *
   * @param {ApplicationRenderContext} context      Shared context provided by _preparePartContext, will be mutated.
   * @param {ApplicationRenderOptions} options       Options which configure application rendering behavior.
   */
  async _prepareChainContext(context, options) {

    /** @type {AdvancementNode[][]} */
    const rootNodes = context.rootNodes = [];

    for (const node of this.chain.nodes.values()) {
      if (!node.active) continue;
      node.enrichedDescription ??= await enrichHTML(node.advancement.description, { relativeTo: node.advancement.document });
      // Possibly a more efficient method here, this is looping over the nodes array a *lot*.
      if (!node.depth) rootNodes.push([node, ...node.descendants()].filter(n => n.active));
    }
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
    const node = this.chain.nodes.get(advancementUuid);
    const configured = await node.advancement.configureAdvancement(node);
    if (!configured) return;
    this.render();
  }
}
