import ItemGrantAdvancement from "../../../data/pseudo-documents/advancements/item-grant-advancement.mjs";
import DSApplication from "../../api/application.mjs";
import AdvancementChain from "../../../utils/advancement-chain.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DrawSteelItem } from "../../../documents/item.mjs";
 * @import { ApplicationConfiguration, ApplicationRenderOptions } from "@client/applications/_types.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 */

/**
 * @typedef ItemGrantConfigurationOptions
 * @property {ItemGrantAdvancement} [advancement] Inferred from the node.
 * @property {AdvancementChain} [node]            The node, if available.
 */

const { DragDrop, TextEditor } = foundry.applications.ux;

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
   * @type {Set<DrawSteelItem>}
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

  /**
   * Helper function to determine the currently selected IDs.
   * @returns {Set<string>}
   * @protected
   */
  get _selected() {
    if (this.node) {
      return Object.entries(this.node.selected).reduce((selected, [uuid, value]) => {
        if (value) selected.add(uuid);
        return selected;
      }, new Set());
    }
    else {
      /** @type {DrawSteelItem} */
      const item = this.advancement.document;
      const path = `flags.draw-steel.advancement.${this.advancement.id}.selected`;
      return item.isEmbedded
        ? new Set(foundry.utils.getProperty(item, path) ?? [])
        : new Set();
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (options.isFirstRender) {
      this.#items = new Set(this.node ?
        Object.values(this.node.choices).map(choice => choice.item)
        : (await Promise.all(this.advancement.pool.map(p => fromUuid(p.uuid)))).filter(_ => _));
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
          disabled: this._selected.size !== this.advancement.chooseN,
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
   * @protected
   */
  async _prepareBody(context, options) {
    context.chooseN = this.advancement.chooseN;

    const selected = this._selected;

    context.items = this.items.map(i => {
      const chosen = selected.has(i.uuid);
      return {
        chosen,
        link: i.toAnchor().outerHTML,
        uuid: i.uuid,
        disabled: !chosen && (selected.size >= this.advancement.chooseN),
      };
    });

    context.expansion = this.advancement.expansion.type;

    context.enrichedDescription = await enrichHTML(this.advancement.description, { relativeTo: this.advancement.document });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (this.advancement.expansion.type) this.#dragDrop.bind(this.element);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const fd = super._processFormData(event, form, formData);

    const uuids = new Set(Array.isArray(fd.choices) ? fd.choices : [fd.choices]);

    if (this.node) {
      this.node.selected = this.items.reduce((selected, item) => {
        selected[item.uuid] = uuids.has(item.uuid);
        return selected;
      }, {});
    }

    if (event.type === "change") this.render();

    return fd;
  }

  /* -------------------------------------------------- */

  /**
   * The Drag Drop handler for this dialog.
   */
  #dragDrop = new DragDrop.implementation({
    callbacks: {
      drop: this._onDrop.bind(this),
    },
  });

  /* -------------------------------------------------- */

  /**
   * Handle a dragged element dropped on a droppable target.
   * Only active if the advancement has `expansion.type` set.
   * @param {DragEvent} event   The drag event being handled.
   */
  async _onDrop(event) {
    const data = TextEditor.implementation.getDragEventData(event);
    const item = await fromUuid(data.uuid);
    if (item?.documentName !== "Item") {
      ui.notifications.error("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Error.MustItem", { localize: true });
      return;
    }
    let allowed = true;
    const expansionInfo = this.advancement.expansion;
    if (item.type !== this.advancement.expansion.type) allowed = false;
    // specific filtering per type
    switch (item.type) {
      case "perk":
        if (expansionInfo.perkType.size && !expansionInfo.perkType.has(item.system.perkType)) allowed = false;
        break;
    }
    if (allowed && !this.items.has(item)) {
      this.items.add(item);
      if (this.node) {
        this.node.choices[item.uuid] = await AdvancementChain.createItemGrantChoice(item, this.node);
        this.node.selected[item.uuid] = true;
      }
      this.render();
    }
    else if (!allowed) ui.notifications.error("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Error.FilterFail", { localize: true });
  }
}
