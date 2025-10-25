import ItemGrantAdvancement from "../../../data/pseudo-documents/advancements/item-grant-advancement.mjs";
import DSApplication from "../../api/application.mjs";
import AdvancementChain from "../../../utils/advancement-chain.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import DrawSteelItem from "../../../documents/item.mjs";
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
      throw new Error("An item grant configuration dialog must be passed an AdvancementChain with an Item Grant.");
    }
    super(options);
    this.#node = node;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["configure-advancement"],
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
   * Cached reference to the actor's current or pending class.
   * Null means there's no class on the actor or in the advancement chain, e.g. If you add an Ancestry before a Class.
   * @type {DrawSteelItem | null}
   */
  #actorClass;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get actorClass() {
    return this.#actorClass;
  }

  /* -------------------------------------------------- */

  /**
   * Cached reference to the actor's current or pending subclasses.
   * @type {DrawSteelItem[]}
   */
  #actorSubclasses;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get actorSubclasses() {
    return this.#actorSubclasses;
  }

  /* -------------------------------------------------- */

  /**
   * The set of DSIDs that can be checked to fulfill requirements.
   * @type {Set<string>}
   */
  #fulfilledDSID;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get fulfilledDSID() {
    if (this.#fulfilledDSID) return this.#fulfilledDSID;

    this.#fulfilledDSID = new Set(this.#actorSubclasses);
    if (this.actorClass) this.#fulfilledDSID.add(this.actorClass.dsid);

    return this.#fulfilledDSID;
  }

  /* -------------------------------------------------- */

  /**
   * Set of uuids chosen by this dialog, which will be saved in the submit process.
   * A new set is constructed each time the form data is processed.
   * @type {Set<string>}
   */
  chosen = new Set();

  /* -------------------------------------------------- */

  /**
   * Total choices made, accounting for possible point buy mechanics.
   * @type {number}
   */
  get totalChosen() {
    if (!this.advancement.pointBuy) return this.chosen.size;
    else return this.items.reduce((points, item) => {
      if (this.chosen.has(item.uuid)) points += item.system.points;
      return points;
    }, 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", {
      name: this.advancement.name,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (options.isFirstRender) {
      this.#items = new Set(Object.values(this.node.choices).map(choice => choice.item));

      this.#actorClass = await this.#getActorClass();

      this.#actorSubclasses = await this.#getActorSubclasses();

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
          label: "Confirm",
          icon: "fa-solid fa-fw fa-check",
          disabled: (this.advancement.chooseN == null) || (this.totalChosen !== this.advancement.chooseN),
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
    context.chooseLabel = (this.advancement.chooseN == null) ?
      game.i18n.localize("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseNull") :
      this.advancement.pointBuy ?
        game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.SpendPoints", { points: this.advancement.chooseN }) :
        game.i18n.format("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseN", { n: this.advancement.chooseN });

    context.additional = this.advancement.additional.type;

    if (context.additional) {
      const perkOptions = ds.CONFIG.perks.typeOptions;
      const perkLabels = Array.from(this.advancement.additional.perkType).map(p => perkOptions.find(o => o.value === p)?.label).filter(_ => _);
      const listFormatter = game.i18n.getListFormatter({ type: "disjunction" });
      const formatData = {
        perkTypes: listFormatter.format(perkLabels),
        itemName: this.advancement.document.name,
      };
      context.additionalText = game.i18n.format(`DRAW_STEEL.ADVANCEMENT.ITEM_GRANT.AdditionalText.${context.additional}`, formatData);
    }

    context.points = this.advancement.pointBuy;

    const totalChosen = this.totalChosen;

    context.items = this.items.map(i => {
      const chosen = this.chosen.has(i.uuid) || (this.advancement.chooseN == null);
      const value = context.points ? i.system.points : 1;
      return {
        chosen,
        link: i.toAnchor().outerHTML,
        uuid: i.uuid,
        points: context.points ? i.system.points : false,
        disabled: !this.#fulfillsRequirements(i) || (!chosen && (value > (this.advancement.chooseN - totalChosen))),
      };
    });

    context.enrichedDescription = await enrichHTML(this.advancement.description, { relativeTo: this.advancement.document });

  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (this.advancement.additional.type) this.#dragDrop.bind(this.element);
    this.form.addEventListener("change", ev => {
      const checkbox = ev.target;
      if (checkbox.checked) this.chosen.add(checkbox.value);
      else this.chosen.delete(checkbox.value);

      this.#refreshDisabled();
    });
  }

  /* -------------------------------------------------- */

  /**
   * Checks if an item fulfills all of its prerequisites.
   * @param {DrawSteelItem} item
   * @returns
   */
  #fulfillsRequirements(item) {
    if ((item.type === "ability") && item.system.class) {
      return this.fulfilledDSID.has(item.system.class);
    } else if (item.system.prerequisites) {
      for (const prerequisite of item.system.prerequisites.dsid) if (!this.fulfilledDSID.has(prerequisite)) return false;
    }
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @returns {Promise<DrawSteelItem | null>}
   */
  async #getActorClass() {
    if (this.node.actor.system.class) return this.node.actor.system.class;
    let node = this.node;
    while (node && (node.advancement.document.type !== "class")) node = node.parent;
    if (node.advancement.document.type === "class") return node.advancement.document;
    else return null;
  }

  /* -------------------------------------------------- */

  /**
   * @returns {Promise<DrawSteelItem[]>}
   */
  async #getActorSubclasses() {
    if (this.node.actor.system.subclasses?.length) return this.node.actor.system.subclasses;
    // check if this is ultimately granted by a subclass
    let node = this.node;
    while (node && (node.advancement.document.type !== "subclass")) node = node.parent;
    if (node && (node.advancement.document.type === "subclass")) return [node.advancement.document];

    const subclasses = [];
    for (const chain of this.node.chains ?? []) {
      if (chain.advancement.type === "itemGrant") {
        for (const uuid of chain.chosenSelection ?? []) {
          const index = fromUuidSync(uuid);
          if (index.type === "subclass") {
            const subclass = await fromUuid(uuid);
            subclasses.push(subclass);
          }
        }
      }
    }
    return subclasses;
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the disabled state of checkboxes and the submit button in this app.
   */
  #refreshDisabled() {
    if (this.advancement.chooseN == null) return;

    const checkboxes = [];
    // could be a RadioNodeList or could be a single checkbox
    if (this.form.choices?.length) checkboxes.push(...this.form.choices);
    else if (this.form.choices) checkboxes.push(this.form.choices);

    const totalChosen = this.totalChosen;

    for (const input of checkboxes) {
      const item = this.items.find(i => i.uuid === input.value);
      if (this.advancement.pointBuy) {
        // if unchosen, potential value is compared to remaining points
        const value = !this.chosen.has(input.value) ? item.system.points : 0;
        input.disabled = this.#fulfillsRequirements(item) && (value > (this.advancement.chooseN - totalChosen));
      }
      else input.disabled = this.#fulfillsRequirements(item) && !this.chosen.has(input.value) && (totalChosen >= this.advancement.chooseN);
    }
    this.element.querySelector("button[type='submit']").disabled = totalChosen !== this.advancement.chooseN;
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

    fd.choices = fd.choices.filter(_ => _);

    return fd;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a dragged element dropped on a droppable target.
   * Only active if the advancement has `additional.type` set.
   * @param {DragEvent} event   The drag event being handled.
   */
  async _onDrop(event) {
    const data = TextEditor.implementation.getDragEventData(event);
    /** @type {DrawSteelItem} */
    const item = await fromUuid(data.uuid);
    if (item?.documentName !== "Item") {
      ui.notifications.error("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Error.MustItem", { localize: true });
      return;
    }
    let allowed = true;
    const additionalInfo = this.advancement.additional;
    if (item.type !== this.advancement.additional.type) allowed = false;
    // specific filtering per type
    switch (item.type) {
      case "perk":
        if (additionalInfo.perkType.size && !additionalInfo.perkType.has(item.system.perkType)) allowed = false;
        break;
      case "subclass":
        if (item.system.classLink !== this.advancement.document.dsid) allowed = false;
        break;
    }
    if (allowed && !this.items.has(item)) {
      this.items.add(item);
      this.node.choices[item.uuid] = await AdvancementChain.createItemGrantChoice(item, this.node);
      this.chosen.add(item.uuid);
      this.element.querySelector(".item-choices").insertAdjacentHTML("beforeend", `<div class="form-group">
        <label>${item.toAnchor().outerHTML}</label>
        <div class="form-fields">
          <input type="checkbox" value="${item.uuid}" name="choices" checked>
        </div>
      </div>`);
      this.#refreshDisabled();
    }
    else if (!allowed) ui.notifications.error("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Error.FilterFail", { localize: true });
  }
}
