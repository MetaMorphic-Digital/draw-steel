import DSRoll from "./base.mjs";

/**
 * Contains damage-specific info like damage types
 */
export default class DamageRoll extends DSRoll {
  /**
   * Button callback to apply damage to selected actors
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!canvas.tokens.controlled.length) return ui.notifications.error("DRAW_STEEL.Messages.AbilityUse.NoTokenSelected", { localize: true });

    const type = event.target.dataset.type;
    let amount = Number(event.target.dataset.amount);
    if (event.shiftKey) amount = Math.floor(amount / 2);

    for (const actor of ds.utils.selectedActors()) {
      await actor.system.takeDamage(amount, { type });
    }
  }

  /**
   * The damage type
   * @type {string}
   */
  get type() {
    return this.options.type ?? "";
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this damage roll's type
   * @type {string}
   */
  get typeLabel() {
    return ds.CONFIG.damageTypes[this.type]?.label ?? "";
  }

  /* -------------------------------------------------- */

  /**
   * Damage immunities to ignore
   * @type {string}
   */
  get ignoredImmunities() {
    return this.options.ignoredImmunities ?? [];
  }

  /**
   * Produces a button with relevant data to applying this damage
   * @returns {HTMLButtonElement} A button that
   */
  toRollButton() {
    return ds.utils.constructHTMLButton({
      label: game.i18n.format("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Label", {
        type: this.typeLabel ? " " + this.typeLabel : "",
        amount: this.total,
      }),
      dataset: {
        type: this.type,
        amount: this.total,
        tooltip: game.i18n.localize("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Tooltip"),
        tooltipDirection: "UP",
      },
      classes: ["apply-damage"],
      icon: "fa-solid fa-burst",
    });
  }
}
