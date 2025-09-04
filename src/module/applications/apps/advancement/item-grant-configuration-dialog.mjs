import ItemGrantAdvancement from "../../../data/pseudo-documents/advancements/item-grant-advancement.mjs";
import DSApplication from "../../api/application.mjs";
import AdvancementChain from "../../../utils/advancement-chain.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DrawSteelItem } from "../../../documents/item.mjs";
 * @import { ApplicationConfiguration, ApplicationRenderOptions } from "@client/applications/_types.mjs";
 */

/**
 * @typedef ItemGrantConfigurationOptions
 * @property {ItemGrantAdvancement} [advancement] Inferred from the node.
 * @property {AdvancementChain} [node]            The node, if available.
 */

/**
 * An application that controls the configuration of an item grant advancement.
 */
export default class ItemGrantConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & ItemGrantConfigurationOptions} options
   */
  constructor({ advancement, node, ...options }) {
    if (!(advancement?.type === "itemGrant")) {
      throw new Error("An item grant configuration dialog must be passed an advancement.");
    }
    super(options);
    this.#node = node ?? null;
    this.#advancement = advancement ?? node.advancement;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["configure-advancement"],
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
    },
    window: {
      icon: "fa-solid fa-edit",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    body: {
      template: systemPath("templates/apps/advancement/item-grant-configuration-dialog/body.hbs"),
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * The advancement being configured.
   * @type {ItemGrantAdvancement}
   */
  #advancement;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get advancement() {
    return this.#advancement;
  }

  /* -------------------------------------------------- */

  /**
   * The node this is configuring. May be null.
   * @type {AdvancementChain | null}
   */
  #node;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get node() {
    return this.#node;
  }

  /* -------------------------------------------------- */

  /**
   * Cached reference to the items this can be configuring. Constructed during the first run of _prepareContext.
   * @type {DrawSteelItem[]}
   */
  #items;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get items() {
    return this.#items;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.advancement.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (options.isFirstRender) {
      this.#items = this.node ?
        Object.values(this.node.choices).map(choice => choice.item)
        : (await Promise.all(this.advancement.pool.map(p => fromUuid(p.uuid)))).filter(_ => _);
    }

    return super._prepareContext(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "body":
        await this._prepareBody(context, options);
        break;
      case "footer":
        context.buttons = [{
          type: "submit",
          action: "close",
          label: "Confirm",
          icon: "fa-solid fa-check",
          disabled: Array.from(this.element.querySelectorAll("input[name=choices]"))
            .reduce((acc, checkbox) => acc + checkbox.checked, 0)
            !== this.advancement.chooseN,
        }];
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare context for the body section.
   * @param {object} context
   * @param {ApplicationRenderOptions} options
   */
  async _prepareBody(context, options) {
    context.chooseN = this.advancement.chooseN;

    /** @type {DrawSteelItem} */
    const item = this.advancement.document;
    const path = `flags.draw-steel.advancement.${this.advancement.id}.selected`;
    const selected = this.node
      ? Object.entries(this.node.selected).reduce((selected, [uuid, value]) => {
        if (value) selected.push(uuid);
        return selected;
      }, [])
      : item.isEmbedded
        ? foundry.utils.getProperty(item, path) ?? []
        : [];
    context.items = this.items.map(i => {
      const chosen = selected.includes(i.uuid);
      return {
        chosen,
        link: i.toAnchor().outerHTML,
        uuid: i.uuid,
        disabled: !chosen && (selected.length >= this.advancement.chooseN),
      };
    });

    context.expansion = this.advancement.expansion.type;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const fd = super._processFormData(event, form, formData);

    const uuids = new Set(fd.choices);

    if (this.node) {
      this.node.selected = this.items.reduce((selected, item) => {
        selected[item.uuid] = uuids.has(item.uuid);
        return selected;
      }, {});
    }

    return fd;
  }
}
