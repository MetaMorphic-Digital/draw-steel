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
    if (!canvas.tokens.controlled.length) return void ui.notifications.error("DRAW_STEEL.Messages.AbilityUse.NoTokenSelected", { localize: true });

    const li = event.currentTarget.closest("[data-message-id]");
    const message = game.messages.get(li.dataset.messageId);
    /** @type {DamageRoll} */
    const roll = message.rolls[event.currentTarget.dataset.index];

    let amount = roll.total;
    if (event.shiftKey) amount = Math.floor(amount / 2);

    for (const actor of ds.utils.selectedActors()) {
      await actor.system.takeDamage(amount, { type: roll.type, ignoredImmunities: roll.ignoredImmunities });
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
   * @type {string[]}
   */
  get ignoredImmunities() {
    return this.options.ignoredImmunities ?? [];
  }

  /**
   * Produces a button with relevant data to applying this damage
   * @param {number} index The index of this roll in the `rolls` array of the message
   * @returns {HTMLButtonElement} A button that
   */
  toRollButton(index) {
    return ds.utils.constructHTMLButton({
      label: game.i18n.format("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Label", {
        type: this.typeLabel ? " " + this.typeLabel : "",
        amount: this.total,
      }),
      dataset: {
        index,
        tooltip: game.i18n.localize("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Tooltip"),
        tooltipDirection: "UP",
      },
      classes: ["apply-damage"],
      icon: "fa-solid fa-burst",
    });
  }
}
