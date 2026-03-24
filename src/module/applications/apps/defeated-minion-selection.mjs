import DSApplication from "../api/application.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * @import DrawSteelToken from "../../canvas/placeables/token.mjs";
 * @import ApplicationRenderContext from "@client/applications/_types.mjs";
 */

/**
 * Prompt application for selecting defeated minions once a threshold has been reached.
 */
export default class DefeatedMinionSelection extends DSApplication {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["defeated-minion-selection"],
    window: {
      title: "DRAW_STEEL.Combat.DefeatedMinionSelection.Title",
      icon: "fa-solid fa-skull",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/apps/defeated-minion-selection/header.hbs"),
    },
    minions: {
      template: systemPath("templates/apps/defeated-minion-selection/minions.hbs"),
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions({ document, ...options }) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = `${this.constructor.name}-${options.context.squad.uuid.replaceAll(".", "-")}`;
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * The currently highlighted minion's token.
   * @type {DrawSteelToken}
   */
  #highlighted = null;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.needToDefeat = this.options.context.needToDefeat;

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "minions":
        await this._prepareMinionsContext(context);
        break;
      case "footer":
        context.buttons = [{ type: "submit", label: "COMMON.Confirm", icon: "fa-solid fa-fw fa-check" }];
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the selected and disabled data for each minion.
   * @param {ApplicationRenderContext} context       Shared context provided by _preparePartContext, will be mutated.
   */
  async _prepareMinionsContext(context) {
    context.undefeatedMinions = [];
    const ctx = this.options.context;
    const selectedMinions = ctx.selected ?? [];
    const maxedSelections = selectedMinions.length >= ctx.needToDefeat;
    for (const minion of ctx.undefeated) {
      const selected = selectedMinions.includes(minion.id) ?? false;
      context.undefeatedMinions.push({
        minion,
        selected,
        disabled: !selected && maxedSelections,
      });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachFrameListeners() {
    super._attachFrameListeners();

    // Hover In
    this.element.addEventListener("pointerover", (event) => {
      const { combatantId } = event.target.closest(".combatant[data-combatant-id]")?.dataset ?? {};
      if (!canvas.ready || !combatantId) return;
      const combatant = this.options.context.combat.combatants.get(combatantId);
      const token = combatant.token?.object;
      if (token && token._canHover(game.user, event) && token.visible) {
        token._onHoverIn(event, { hoverOutOthers: true });
        this.#highlighted = token;
      }
    }, { passive: true });

    // Hover Out
    this.element.addEventListener("pointerout", (event) => {
      this.#highlighted?._onHoverOut(event);
      this.#highlighted = null;
    }, { passive: true });
  }

  /* -------------------------------------------------- */

  /**
   * Amend the currently selected minions based on form data.
   * @inheritdoc
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    const formData = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object);
    const selection = Array.isArray(formData["minion-selection"]) ? formData["minion-selection"] : [formData["minion-selection"]];
    this.options.context.selected = selection.filter(_ => _);

    this.render({ parts: ["minions"] });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData, submitOptions) {
    return { selectedMinions: this.options.context.selected ?? [] };
  }
}
