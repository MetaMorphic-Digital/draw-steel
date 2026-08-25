import DSApplication from "../../api/application.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import DrawSteelActor from "../../../documents/actor.mjs";
 * @import AdvancementNode from "../../../utils/advancement/node.mjs";
 * @import ActorChoiceAdvancement from "../../../data/pseudo-documents/advancements/actor-choice-advancement.mjs";
 * @import { ApplicationConfiguration, ApplicationRenderOptions } from "@client/applications/_types.mjs";
 */

/**
 * @typedef ActorChoiceConfigurationOptions
 * @property {ActorChoiceAdvancement} advancement   The advancement to configure.
 * @property {string[]} chosen                      Chosen actors by UUID.
 */

/**
 * An application that controls the configuration of an actor choice advancement.
 */
export default class ActorChoiceConfigurationDialog extends DSApplication {
  /**
   * @param {ApplicationConfiguration & ActorChoiceConfigurationOptions} options
   */
  constructor({ advancement, chosen, ...options }) {
    if (!(advancement?.isActorChoice)) {
      throw new Error("An actor choice configuration dialog must be passed an AdvancementNode with an Actor Choice.");
    }
    super(options);
    this.#advancement = advancement;
    this.chosen = new Set(chosen);
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
      template: systemPath("templates/apps/advancement/actor-choice-configuration-dialog/body.hbs"),
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  #advancement;
  /**
   * The advancement being configured.
   * @type {ActorChoiceAdvancement}
   */
  get advancement() {
    return this.#advancement;
  }

  /* -------------------------------------------------- */

  /**
   * Cached reference to the actors this can be configuring. Constructed during the first run of _prepareContext.
   * @type {Set<DrawSteelActor>}
   */
  #actors = new Set();
  // eslint-disable-next-line @jsdoc/require-jsdoc
  get actors() {
    return this.#actors;
  }

  /* -------------------------------------------------- */

  /**
   * Set of uuids chosen by this dialog, which will be saved in the submit process.
   * A new set is constructed each time the form data is processed.
   * @type {Set<string>}
   */
  chosen;

  /* -------------------------------------------------- */

  /**
   * Total choices made.
   * @type {number}
   */
  get totalChosen() {
    return this.chosen.size;
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
    // fromUuid call respects caching
    if (options.isFirstRender) for (const { uuid } of this.#advancement.actorOptions) this.#actors.add(await fromUuid(uuid));

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
          // == null covers null & undefined
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
    // == null covers null & undefined
    context.chooseLabel = (this.advancement.chooseN == null)
      ? _loc("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseNull")
      : _loc("DRAW_STEEL.ADVANCEMENT.ConfigureAdvancement.ChooseN", { n: this.advancement.chooseN });

    const totalChosen = this.totalChosen;

    context.actors = this.actors.map(e => {
      const chosen = this.chosen.has(e.uuid) || (this.advancement.chooseN == null);
      const disabled = !chosen && (totalChosen >= this.advancement.chooseN);
      return {
        disabled,
        chosen: chosen && !disabled,
        link: e.toAnchor().outerHTML,
        uuid: e.uuid,
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
    // == null covers null & undefined
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
