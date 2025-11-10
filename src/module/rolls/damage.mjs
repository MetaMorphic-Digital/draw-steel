import DSRoll from "./base.mjs";
import { decodePayload, encodePayload, escapeHtml, partitionTokensByOwnership } from "../utils/gm-action.mjs";

/**
 * Contains damage-specific info like damage types.
 */
export default class DamageRoll extends DSRoll {
  static async _applyResultToActor(actor, { amount, isHealing, applyToTemporary, rollType, ignoredImmunities }) {
    if (!actor) return;

    if (isHealing) {
      if (applyToTemporary && amount < actor.system.stamina.temporary) {
        ui.notifications.warn("DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.TempCapped", { format: { name: actor.name } });
        return;
      }

      const attribute = applyToTemporary ? "stamina.temporary" : "stamina";
      await actor.modifyTokenAttribute(attribute, amount, !applyToTemporary, !applyToTemporary);
      return;
    }

    await actor.system.takeDamage(amount, {
      type: rollType,
      ignoredImmunities,
    });
  }

  /**
   * Button callback to apply damage to selected actors.
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!game.user?.targets?.size) {
      return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
    }

    const listItem = event.currentTarget.closest("[data-message-id]");
    if (!listItem) return;

    const message = game.messages.get(listItem.dataset.messageId);
    if (!message) return;

    const rollIndex = Number(event.currentTarget.dataset.index);
    /** @type {DamageRoll} */
    const roll = message.rolls?.[rollIndex];
    if (!roll) return;

    const rawAmount = roll.total;
    const amount = event.shiftKey ? Math.floor(rawAmount / 2) : rawAmount;
    const targetedTokens = [...game.user.targets].filter((token) => token?.document && token.actor);

    this._registerGMButtonHookOnce();

    const isHealing = Boolean(roll.isHeal);
    const applyToTemporary = isHealing && roll.type !== "value";
    const rollType = roll.type ?? null;
    const ignoredImmunities = roll.ignoredImmunities ?? [];

    const { controllable, restricted } = partitionTokensByOwnership(targetedTokens, game.user);

    for (const token of controllable) {
      await this._applyResultToActor(token.actor, {
        amount,
        isHealing,
        applyToTemporary,
        rollType,
        ignoredImmunities,
      });
    }

    for (const token of restricted) {
      await this._whisperGMApplyButton({
        sceneId: token.document.parent?.id ?? token.scene?.id,
        tokenId: token.id,
        tokenName: token.name,
        amount,
        isHealing,
        applyToTemporary,
        rollType,
        ignoredImmunities,
      });
    }
  }

  static async _whisperGMApplyButton({ sceneId, tokenId, tokenName, amount, isHealing, applyToTemporary, rollType, ignoredImmunities }) {
    const gmIds = game.users.filter((user) => user.isGM).map((user) => user.id);
    if (!gmIds.length) return;

    const payload = {
      sceneId,
      tokenId,
      amount,
      isHealing,
      applyToTemporary,
      rollType,
      ignoredImmunities,
    };

    const safeName = escapeHtml(tokenName);
    const label = isHealing
      ? (applyToTemporary ? (game.i18n.localize("DRAW_STEEL.UI.ApplyTempHeal") || "Apply Temporary Heal")
                         : (game.i18n.localize("DRAW_STEEL.UI.ApplyHeal") || "Apply Heal"))
      : (game.i18n.localize("DRAW_STEEL.UI.ApplyDamage") || "Apply Damage");

    const requestLine = game.i18n.localize?.("DRAW_STEEL.UI.RequestGMApplyLine") || "Permission request for token:";
    const changeLabel = isHealing ? (applyToTemporary ? "Temp Heal" : "Heal") : "Damage";
    const rollTypeSuffix = !isHealing && rollType ? ` (${escapeHtml(rollType)})` : "";

    const content = `
      <div class="ds-gm-apply">
        <p><strong>${requestLine}</strong> ${safeName}</p>
        <p>${changeLabel}: <strong>${amount}</strong>${rollTypeSuffix}</p>
        <button type="button"
          class="ds-apply-damage-gm"
          data-ds='${encodePayload(payload)}'>
          ${label}
        </button>
      </div>
    `;

    await ChatMessage.create({
      content,
      whisper: gmIds,
      style: CONST.CHAT_MESSAGE_STYLES.OOC,
    });
  }

  static _registerGMButtonHookOnce() {
    if (this._dsHookRegistered) return;
    this._dsHookRegistered = true;

    Hooks.on("renderChatMessage", (message, html) => {
      html.on("click", ".ds-apply-damage-gm", async (ev) => {
        ev.preventDefault();
        try {
          if (!game.user.isGM) {
            return ui.notifications.warn(game.i18n.localize("DRAW_STEEL.UI.GMOnly") || "GM only.");
          }
          const btn = ev.currentTarget;
          const encoded = btn.dataset.ds;
          if (!encoded) return;

          const data = decodePayload(encoded);
          const scene = game.scenes.get(data.sceneId) ?? canvas?.scene;
          let tokenDoc = scene?.tokens?.get(data.tokenId) ?? canvas?.tokens?.get(data.tokenId)?.document;
          if (!tokenDoc) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.TokenNotFound") || "Token not found.");
          }

          const actor = tokenDoc.actor;
          if (!actor) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ActorNotFound") || "Actor not available for token.");
          }

          const amount = Number(data.amount) || 0;
          const isHealing = Boolean(data.isHealing);
          const applyToTemporary = Boolean(data.applyToTemporary);
          const rollType = data.rollType ?? null;
          const ignoredImmunities = Array.isArray(data.ignoredImmunities) ? data.ignoredImmunities : [];

          await this._applyResultToActor(actor, {
            amount,
            isHealing,
            applyToTemporary,
            rollType,
            ignoredImmunities,
          });

          btn.disabled = true;
          btn.textContent = game.i18n.localize("DRAW_STEEL.UI.Applied") || "Applied";
        } catch (err) {
          console.error(err);
          ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ApplyFailed") || "Failed to apply.");
        }
      });
    });
  }

  /* -------------------------------------------------- */

  /**
   * The damage type.
   * @type {string}
   */
  get type() {
    return this.options.type ?? (this.isHeal ? "value" : "");
  }

  /* -------------------------------------------------- */

  /**
   * The localized label for this damage roll's type.
   * @type {string}
   */
  get typeLabel() {
    if (this.isHeal) return ds.CONFIG.healingTypes[this.type]?.label;
    return ds.CONFIG.damageTypes[this.type]?.label ?? "";
  }

  /* -------------------------------------------------- */

  /**
   * Damage immunities to ignore.
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
   * Produces a button with relevant data to applying this damage.
   * @param {number} index The index of this roll in the `rolls` array of the message.
   * @returns {HTMLButtonElement} A button that.
   */
  toRollButton(index) {
    const labelPath = this.isHeal ? "DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.Label" : "DRAW_STEEL.ChatMessage.base.Buttons.ApplyDamage.Label";

    const tooltipPath = this.isHeal ? "DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.Tooltip" : "DRAW_STEEL.ChatMessage.base.Buttons.ApplyDamage.Tooltip";

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

DamageRoll._registerGMButtonHookOnce();
