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
 * @property {AdvancementChain} node   The node to configure.
 */

const { DragDrop, TextEditor } = foundry.applications.ux;

/**
 * An application that controls the configuration of an item grant advancement.
 */
export default class ItemGrantConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & ItemGrantConfigurationOptions} options
   */
  constructor({ node, ...options }) {
    if (!(node.advancement?.type === "itemGrant")) {
      throw new Error("An item grant configuration dialog must be passed an advancement.");
    }
    super(options);
    this.#node = node;
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
  get advancement() {
    return this.#node.advancement;
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

  /**
   * Set of uuids chosen by this dialog, which will be saved in the submit process.
   * A new set is constructed each time the form data is processed.
   * @type {Set<string>}
   */
  chosen = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", { name: this.advancement.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (options.isFirstRender) {
      this.#items = new Set(Object.values(this.node.choices).map(choice => choice.item));

      for (const item of this.items) {
        if (this.node.selected[item.uuid]) this.chosen.add(item.uuid);
      }
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
          disabled: this.chosen.size !== this.advancement.chooseN,
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

    context.items = this.items.map(i => {
      const chosen = this.chosen.has(i.uuid);
      return {
        chosen,
        link: i.toAnchor().outerHTML,
        uuid: i.uuid,
        disabled: !chosen && (this.chosen.size >= this.advancement.chooseN),
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

  /**
   * The Drag Drop handler for this dialog.
   */
  #dragDrop = new DragDrop.implementation({
    callbacks: {
      drop: this._onDrop.bind(this),
    },
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions = {}) {
    const fd = super._processFormData(event, form, formData, submitOptions);

    if (!fd.choices) fd.choices = [];
    else if (!Array.isArray(fd.choices)) fd.choices = [fd.choices];

    // Passed by the onDrop logic
    if (submitOptions.expansion) fd.choices.push(...submitOptions.expansion);

    fd.choices = fd.choices.filter(_ => _);

    this.chosen = new Set(fd.choices);

    this.element.querySelector("button[type='submit'][data-action='close']").disabled = this.chosen.size !== this.advancement.chooseN;

    return fd;
  }

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
      this.node.choices[item.uuid] = await AdvancementChain.createItemGrantChoice(item, this.node,
        { levelStart: null, levelEnd: 1 }, // TODO: Figure out levelEnd
      );
      this.chosen.add(item.uuid);
      await this.submit({ expansion: [item.uuid] });
      await this.render();
    }
    else if (!allowed) ui.notifications.error("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Error.FilterFail", { localize: true });
  }
}
