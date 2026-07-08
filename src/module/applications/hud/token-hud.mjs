import { systemPath } from "../../constants.mjs";

/**
 * A custom Token HUD that implements Draw Steel effect handling.
 */
export default class DrawSteelTokenHUD extends foundry.applications.hud.TokenHUD {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      effect: {
        handler: this.#onToggleEffect,
      },
    },
  };

  /* -------------------------------------------------- */

  /**
   * Current option for the select, not stored in the database and shared between all tokens.
   * Expected to be be a valid key of {@linkcode ds.CONFIG.effectEnds}.
   * @type {string}
   */
  #effectEnd = "";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getStatusEffectChoices() {
    const choiceList = [];
    for (const status of foundry.utils.iterateValues(CONFIG.statusEffects)) {
      if ((status.hud === false) || (status.hud?.actorTypes?.includes(this.actor?.type) === false)) {
        continue;
      }
      choiceList.push({
        _id: status._id,
        id: status.id,
        title: _loc(status.name ?? ""),
        src: status.img,
        order: status.order ?? 0,
        isActive: false,
        isOverlay: false,
        disabled: false,
        effects: [],
      });
    }
    const choices = choiceList.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title, game.i18n.lang))
      .reduce((obj, choice) => {
        obj[choice.id] = choice;
        return obj;
      }, {});

    // Update the status of effects which are active for the token actor
    const activeEffects = this.actor?.effects ?? [];
    for (const effect of activeEffects) {
      for (const statusId of effect.statuses) {
        const status = choices[statusId];
        if (!status) continue;
        if (status._id) {
          if (status._id !== effect.id) {
            status.disabled = true;
            status.tooltip = "DRAW_STEEL.ActiveEffect.ComplexStatus";
          }
          else status.effects.push(effect.id);
        } else {
          if (effect.statuses.size !== 1) {
            status.disabled = true;
            status.tooltip = "DRAW_STEEL.ActiveEffect.ComplexStatus";
          }
          else status.effects.push(effect.id);
        }
        status.isActive = effect.active;
        if (effect.getFlag("core", "overlay")) status.isOverlay = true;
      }
    }

    // Flag status CSS class
    for (const status of Object.values(choices)) {
      status.cssClass = [
        status.isActive ? "active" : null,
        status.isOverlay ? "overlay" : null,
      ].filterJoin(" ");
      status.effectIds = status.effects.join(" ");
    }
    return choices;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    context.dsEffectEnds = {
      selected: this.#effectEnd,
      options: ds.CONFIG.effectEnds,
    };

    const effectPalette = this.element.querySelector("div[data-palette=\"effects\"]");

    const paletteContents = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/effect-palette.hbs"), context);

    effectPalette.innerHTML = paletteContents;

    const effectEndSelect = effectPalette.querySelector("[data-name=\"system.end.type\"]");

    effectEndSelect.addEventListener("change", (ev) => {
      this.#effectEnd = effectEndSelect.value;
    });
  }

  /* -------------------------------------------------- */

  /**
   * Handle toggling a token status effect icon.
   * @this {DrawSteelTokenHUD}
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #onToggleEffect(event, target) {
    if (!this.actor) {
      ui.notifications.warn("HUD.WarningEffectNoActor", { localize: true });
      return;
    }
    const { statusId, effectIds } = target.dataset;

    const active = !target.classList.contains("active");

    // The condition might exist but be inactive
    if (active && effectIds) {
      await this.actor.deleteEmbeddedDocuments("ActiveEffect", effectIds.split(" "));
    }

    await this.actor.toggleStatusEffect(statusId, {
      active,
      overlay: event.button === 2,
      effectEnd: this.#effectEnd,
    });
  }
}
