import DSRoll from "./base.mjs";

/**
 * Contains damage-specific info like damage types.
 */
export default class DamageRoll extends DSRoll {
  /** Escape simple HTML entities for safe string interpolation. */
  static _escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
    );
  }

  static _packPayload(obj) {
    return btoa(encodeURIComponent(JSON.stringify(obj)));
  }

  static _unpackPayload(s) {
    return JSON.parse(decodeURIComponent(atob(s)));
  }

  static _canModifyToken(token, user = game.user) {
    const OWNER = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
    return token?.document?.testUserPermission?.(user, OWNER) ?? token?.document?.isOwner ?? false;
  }

  /**
   * Button callback to apply damage to selected actors.
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!game.user?.targets?.size) {
      return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
    }

    const li = event.currentTarget.closest("[data-message-id]");
    const message = game.messages.get(li.dataset.messageId);
    /** @type {DamageRoll} */
    const roll = message.rolls[event.currentTarget.dataset.index];

    let amount = roll.total;
    if (event.shiftKey) amount = Math.floor(amount / 2);
    const tokens = [...game.user.targets].filter((t) => t?.document);

    this._registerGMButtonHookOnce();

    for (const token of tokens) {
      const actor = token.actor;
      if (!actor) continue;

      const canModify = this._canModifyToken(token, game.user);

      const isHeal = !!roll.isHeal;
      const isTemp = isHeal ? roll.type !== "value" : false;

      if (canModify) {
        if (isHeal) {
          if (isTemp && (amount < actor.system.stamina.temporary)) {
            ui.notifications.warn("DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.TempCapped", { format: { name: actor.name } });
          } else {
            await actor.modifyTokenAttribute(isTemp ? "stamina.temporary" : "stamina", amount, !isTemp, !isTemp);
          }
        } else {
          await actor.system.takeDamage(amount, { type: roll.type, ignoredImmunities: roll.ignoredImmunities });
        }
      } else {
        await this._whisperGMApplyButton({
          sceneId: token.document.parent?.id ?? token.scene?.id,
          tokenId: token.id,
          tokenName: token.name,
          amount,
          isHeal,
          isTemp,
          rollType: roll.type,
          ignoredImmunities: roll.ignoredImmunities ?? [],
        });
      }
    }
  }

  static async _whisperGMApplyButton({ sceneId, tokenId, tokenName, amount, isHeal, isTemp, rollType, ignoredImmunities }) {
    const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
    if (!gmIds.length) return;

    const payload = {
      s: sceneId,
      t: tokenId,
      n: tokenName,
      m: amount,
      h: isHeal ? 1 : 0,
      te: isTemp ? 1 : 0,
      rt: rollType ?? null,
      ii: ignoredImmunities ?? [],
    };

    const safeName = this._escapeHTML(tokenName ?? "");
    const label = isHeal
      ? (isTemp ? (game.i18n.localize("DRAW_STEEL.UI.ApplyTempHeal") || "Apply Temporary Heal")
                : (game.i18n.localize("DRAW_STEEL.UI.ApplyHeal") || "Apply Heal"))
      : (game.i18n.localize("DRAW_STEEL.UI.ApplyDamage") || "Apply Damage");

    const requestLine = game.i18n.localize?.("DRAW_STEEL.UI.RequestGMApplyLine") || "Permission request for token:";

    const content = `
      <div class="ds-gm-apply">
        <p><strong>${requestLine}</strong> ${safeName}</p>
        <p>${isHeal ? (isTemp ? "Temp Heal" : "Heal") : "Damage"}: <strong>${amount}</strong>${!isHeal && rollType ? ` (${this._escapeHTML(rollType)})` : ""}</p>
        <button type="button"
          class="ds-apply-damage-gm"
          data-ds='${this._packPayload(payload)}'>
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

          const data = this._unpackPayload(encoded);
          const scene = game.scenes.get(data.s) ?? canvas?.scene;
          let tokenDoc = scene?.tokens?.get(data.t) ?? canvas?.tokens?.get(data.t)?.document;
          if (!tokenDoc) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.TokenNotFound") || "Token not found.");
          }

          const actor = tokenDoc.actor;
          if (!actor) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ActorNotFound") || "Actor not available for token.");
          }

          const amount = Number(data.m) || 0;
          const isHeal = !!data.h;
          const isTemp = !!data.te;
          const rollType = data.rt ?? null;
          const ignoredImmunities = Array.isArray(data.ii) ? data.ii : [];

          if (isHeal) {
            if (isTemp && (amount < actor.system.stamina.temporary)) {
              ui.notifications.warn("DRAW_STEEL.ChatMessage.base.Buttons.ApplyHeal.TempCapped", { format: { name: actor.name } });
            } else {
              await actor.modifyTokenAttribute(isTemp ? "stamina.temporary" : "stamina", amount, !isTemp, !isTemp);
            }
          } else {
            await actor.system.takeDamage(amount, { type: rollType, ignoredImmunities });
          }

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
