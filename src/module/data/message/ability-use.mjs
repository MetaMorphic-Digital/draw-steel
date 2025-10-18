
import BaseMessageModel from "./base.mjs";
import DrawSteelActiveEffect from "../../documents/active-effect.mjs";

/**
 * @import { ActiveEffectData } from "@common/documents/_types.mjs";
 * @import AbilityModel from "../item/ability.mjs";
 * @import AppliedPowerRollEffect from "../pseudo-documents/power-roll-effects/applied-effect.mjs";
 * @import DrawSteelItem from "../../documents/item.mjs"
 */

const fields = foundry.data.fields;

/**
 * Chat messages representing the result of {@linkcode AbilityModel.use}.
 */
export default class AbilityUseModel extends BaseMessageModel {
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

  static _registerGMApplyButtonHookOnce() {
    if (this._dsHookRegistered) return;
    this._dsHookRegistered = true;

    const cls = this;
    Hooks.on("renderChatMessage", (message, html) => {
      html.on("click", ".ds-apply-effect-gm", async (ev) => {
        ev.preventDefault();
        try {
          if (!game.user.isGM) {
            return ui.notifications.warn(game.i18n.localize("DRAW_STEEL.UI.GMOnly") || "GM only.");
          }

          const btn = ev.currentTarget;
          const encoded = btn.dataset.ds;
          if (!encoded) return;

          const data = cls._unpackPayload(encoded);
          const scene = game.scenes.get(data.s) ?? canvas?.scene;
          let tokenDoc = scene?.tokens?.get(data.t) ?? canvas?.tokens?.get(data.t)?.document;
          if (!tokenDoc) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.TokenNotFound") || "Token not found.");
          }

          const actor = tokenDoc.actor;
          if (!actor) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ActorNotFound") || "Actor not available for token.");
          }

          const effectData = data.e;
          if (!effectData) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.EffectNotFound") || "Effect not found.");
          }

          await actor.createEmbeddedDocuments("ActiveEffect", [effectData], { keepId: !!data.k });

          btn.disabled = true;
          btn.textContent = game.i18n.localize("DRAW_STEEL.UI.Applied") || "Applied";
        } catch (err) {
          console.error(err);
          ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ApplyFailed") || "Failed to apply.");
        }
      });
    });
  }

  static async _whisperGMApplyButton({ sceneId, tokenId, tokenName, effectName, effectData, keepId }) {
    const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
    if (!gmIds.length) return;

    const payload = {
      s: sceneId,
      t: tokenId,
      e: effectData,
      k: keepId ? 1 : 0,
    };

    const safeTokenName = this._escapeHTML(tokenName ?? "");
    const safeEffectName = this._escapeHTML(effectName ?? "");
    const label = game.i18n.localize("DRAW_STEEL.UI.ApplyEffect") || "Apply Effect";
    const requestLine = game.i18n.localize?.("DRAW_STEEL.UI.RequestGMApplyLine") || "Permission request for token:";
    const effectLine = game.i18n.localize?.("DRAW_STEEL.UI.EffectLabel") || "Effect";

    const content = `
      <div class="ds-gm-apply">
        <p><strong>${requestLine}</strong> ${safeTokenName}</p>
        <p>${effectLine}: <strong>${safeEffectName}</strong></p>
        <button type="button"
          class="ds-apply-effect-gm"
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

  /** @inheritdoc */
  static get metadata() {
    return {
      type: "abilityUse",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // All ability use messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });
    schema.embedText = new fields.BooleanField({ initial: true });
    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * The displayed result tier.
   * @type {1 | 2 | 3 | undefined}
   */
  get tier() {
    // First roll is always the base roll, second is the result. Only one tier per message.
    return this.parent.rolls[1]?.product;
  }

  /* -------------------------------------------------- */

  /**
   * The key of the tier.
   * @type {"tier1" | "tier2" | "tier3" | null}
   */
  get tierKey() {
    const tier = this.tier;
    if (tier) return `tier${tier}`;
    else return null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);

    const tierKey = this.tierKey;

    /** @type {HTMLDivElement} */
    const content = html.querySelector(".message-content");

    if (this.embedText) {
      /** @type {HTMLDivElement} */
      let embed;
      if (item) {
        const embedConfig = {};
        if (tierKey) embedConfig[tierKey] = true;
        embed = await item.toEmbed(embedConfig);
      }
      else {
        embed = document.createElement("p");
        embed.innerText = game.i18n.localize("DRAW_STEEL.Item.ability.EmbedFail");
      }

      // If it's a roll, the roll rendering will replace the message's stored content. Otherwise we need to do it.
      if (this.parent.isRoll) content.insertAdjacentElement("afterbegin", embed);
      else content.innerHTML = embed.outerHTML;
    } else if (item && tierKey) {
      content.insertAdjacentHTML("afterbegin", `<p class="powerResult"><strong>${
        game.i18n.localize(`DRAW_STEEL.ROLL.Power.Results.Tier${this.tier}`)
      }: </strong>${item.system.power.effects.contents.map(effect => effect.toText(this.tier)).filter(_ => _).join("; ")}</p>`,
      );
    } else console.warn("Invalid configuration");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();
    const tier = this.tier;
    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);
    if (!tier || !item) return buttons;
    for (const pre of item.system.power.effects) {
      const newButtons = await pre.constructButtons(tier);
      if (newButtons) buttons.push(...newButtons);
    }
    return buttons;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);
    /** @type {HTMLButtonElement[]} */
    const effectButtons = html.querySelectorAll(".apply-effect");
    for (const effectButton of effectButtons) effectButton.addEventListener("click", async (event) => {
      /** @type {AppliedPowerRollEffect} */
      const pre = await fromUuid(effectButton.dataset.uuid);
      if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoPRE", { localize: true });
      const effectId = effectButton.dataset.effectId;
      const config = pre.applied[this.tierKey].effects[effectId];

      const noStack = !config.properties.has("stacking");

      /** @type {DrawSteelActiveEffect} */
      const tempEffect = effectButton.dataset.type === "custom" ?
        pre.item.effects.get(effectId).clone({}, { keepId: noStack, addSource: true }) :
        await DrawSteelActiveEffect.fromStatusEffect(effectId);

      /** @type {ActiveEffectData} */
      const updates = {
        transfer: true,
        origin: pre.uuid,
        system: {},
      };
      if (config.end) updates.system.end = { type: config.end };
      tempEffect.updateSource(updates);

      if (!game.user?.targets?.size) {
        return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
      }

      const user = game.user;
      const targets = [...user.targets].filter((t) => t?.document && t.actor);
      if (!targets.length) {
        return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
      }

      const cls = this.constructor;
      cls._registerGMApplyButtonHookOnce();

      const effectData = tempEffect.toObject();
      const ownedActors = new Map();
      const gmTokens = [];

      for (const token of targets) {
        const actor = token.actor;
        if (!actor) continue;

        if (cls._canModifyToken(token, user)) {
          const key = actor.uuid ?? actor.id ?? actor._id ?? foundry.utils.randomID();
          ownedActors.set(key, actor);
        }
        else gmTokens.push(token);
      }

      for (const actor of ownedActors.values()) {
        // reusing the ID will block creation if it's already on the actor
        // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
        await actor.createEmbeddedDocuments("ActiveEffect", [foundry.utils.duplicate(effectData)], { keepId: noStack });
      }

      for (const token of gmTokens) {
        await cls._whisperGMApplyButton({
          sceneId: token.document.parent?.id ?? token.scene?.id,
          tokenId: token.id,
          tokenName: token.name,
          effectName: tempEffect?.name ?? effectId,
          effectData: foundry.utils.duplicate(effectData),
          keepId: noStack,
        });
      }
    });
  }
}
