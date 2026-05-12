import AdvancementLeaf from "../../../utils/advancement/leaf.mjs";
import DSApplication from "../../api/application.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import DrawSteelActiveEffect from "../../../documents/active-effect.mjs";
 * @import AdvancementNode from "../../../utils/advancement/node.mjs";
 * @import EffectGrantAdvancement from "../../../data/pseudo-documents/advancements/effect-grant-advancement.mjs";
 * @import { ApplicationConfiguration, ApplicationRenderOptions } from "@client/applications/_types.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 */

/**
 * @typedef EffectGrantConfigurationOptions
 * @property {AdvancementNode} node   The node to configure.
 */

const { DragDrop, TextEditor } = foundry.applications.ux;

/**
 * An application that controls the configuration of an effect grant advancement.
 */
export default class EffectGrantConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & EffectGrantConfigurationOptions} options
   */
  constructor({ node, ...options }) {
    if (!(node.advancement?.type === "effectGrant")) {
      throw new Error("An effect grant configuration dialog must be passed an AdvancementNode with an Effect Grant.");
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
      template: systemPath("templates/apps/advancement/effect-grant-configuration-dialog/body.hbs"),
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * The advancement being configured.
   * @type {EffectGrantAdvancement}
   */
  get advancement() {
    return this.#node.advancement;
  }

  /* -------------------------------------------------- */

  /**
   * The node this is configuring. May be null.
   * @type {AdvancementNode | null}
   */
  #node;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get node() {
    return this.#node;
  }

  /* -------------------------------------------------- */

  /**
   * Cached reference to the effects this can be configuring. Constructed during the first run of _prepareContext.
   * @type {Set<DrawSteelActiveEffect>}
   */
  #effects;
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get effects() {
    return this.#effects;
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
    return this.effects.reduce((points, effect) => {
      points += this.chosen.has(effect.uuid);
      return points;
    }, 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return _loc("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.Title", {
      name: this.advancement.name,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    if (options.isFirstRender) {
      this.#effects = new Set(Object.values(this.node.choices).map(choice => choice.effect));

      this.effects.forEach(effect => {
        if (this.node.selected[effect.uuid]) this.chosen.add(effect.uuid);
      });
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
          label: "COMMON.Confirm",
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
    context.chooseLabel = (this.advancement.chooseN == null)
      ? _loc("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseNull")
      : _loc("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseN", { n: this.advancement.chooseN });

    const totalChosen = this.totalChosen;

    context.effects = this.effects.map(e => {
      const chosen = this.chosen.has(e.uuid) || (this.advancement.chooseN == null);
      const disabled = !chosen && (totalChosen >= this.advancement.chooseN);
      return {
        disabled,
        chosen: chosen && !disabled,
        link: e.toAnchor().outerHTML,
        uuid: e.uuid,
        points: context.points ? e.system.points : false,
      };
    });

    context.enrichedDescription = await enrichHTML(this.advancement.description, { relativeTo: this.advancement.document });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.form.addEventListener("change", ev => {
      const checkbox = ev.target;
      if (checkbox.checked) this.chosen.add(checkbox.value);
      else this.chosen.delete(checkbox.value);

      this.#refreshDisabled(ev.target);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the disabled state of checkboxes and the submit button in this app.
   */
  #refreshDisabled() {
    if (this.advancement.chooseN == null) return;

    /** @type {HTMLInputElement[]} */
    const checkboxes = [];
    // could be a RadioNodeList or could be a single checkbox
    if (this.form.choices?.length) checkboxes.push(...this.form.choices);
    else if (this.form.choices) checkboxes.push(this.form.choices);

    const totalChosen = this.totalChosen;

    for (const input of checkboxes) {
      input.disabled = !this.chosen.has(input.value) && (totalChosen >= this.advancement.chooseN);
    }
    this.element.querySelector("button[type='submit']").disabled = totalChosen !== this.advancement.chooseN;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions = {}) {
    const fd = super._processFormData(event, form, formData, submitOptions);

    if (!fd.choices) fd.choices = [];
    else if (!Array.isArray(fd.choices)) fd.choices = [fd.choices];

    fd.choices = fd.choices.filter(_ => _);

    return fd;
  }
}
