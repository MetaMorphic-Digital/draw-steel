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
    for (const actor of ds.utils.tokensToActors()) {
      if (roll.isHeal) {
        const isTemp = roll.type !== "value";
        if (isTemp && (amount < actor.system.stamina.temporary)) ui.notifications.warn("DRAW_STEEL.Messages.base.Buttons.ApplyHeal.TempCapped", {
          format: { name: actor.name },
        });
        else await actor.modifyTokenAttribute(isTemp ? "stamina.temporary" : "stamina", amount, !isTemp, !isTemp);
      }
      else await actor.system.takeDamage(amount, { type: roll.type, ignoredImmunities: roll.ignoredImmunities });
    }
  }

  /**
   * The damage type
   * @type {string}
   */
  get type() {
    return this.options.type ?? (this.isHeal ? "value" : "");
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this damage roll's type
   * @type {string}
   */
  get typeLabel() {
    if (this.isHeal) return ds.CONFIG.healingTypes[this.type]?.label;
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

  /* -------------------------------------------------- */

  /**
   * Does this represent healing?
   * @type {boolean}
   */
  get isHeal() {
    return this.options.isHeal || false;
  }

  /* -------------------------------------------------- */

  /**
   * Produces a button with relevant data to applying this damage
   * @param {number} index The index of this roll in the `rolls` array of the message
   * @returns {HTMLButtonElement} A button that
   */
  toRollButton(index) {
    const labelPath = this.isHeal ? "DRAW_STEEL.Messages.base.Buttons.ApplyHeal.Label" : "DRAW_STEEL.Messages.base.Buttons.ApplyDamage.Label";

    const tooltipPath = this.isHeal ? "DRAW_STEEL.Messages.base.Buttons.ApplyHeal.Tooltip" : "DRAW_STEEL.Messages.base.Buttons.ApplyDamage.Tooltip";

    return ds.utils.constructHTMLButton({
      label: game.i18n.format(labelPath, {
        type: this.typeLabel ? " " + this.typeLabel : "",
        amount: this.total,
      }),
      dataset: {
        index,
        tooltip: game.i18n.localize(tooltipPath),
        tooltipDirection: "UP",
      },
      classes: ["apply-damage"],
      icon: this.isHeal ? "fa-solid fa-heart-pulse" : "fa-solid fa-burst",
    });
  }
}
