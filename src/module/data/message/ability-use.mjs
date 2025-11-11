import BaseMessageModel from "./base.mjs";
import DrawSteelActiveEffect from "../../documents/active-effect.mjs";
import DamageRoll from "../../rolls/damage.mjs";
import { decodePayload, encodePayload, escapeHtml, partitionTokensByOwnership } from "../../utils/gm-action.mjs";

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

  static _registerGMApplyButtonHookOnce() {
    if (this._dsHookRegistered) return;
    this._dsHookRegistered = true;

    const ModelClass = this;
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

          const data = decodePayload(encoded);
          const scene = game.scenes.get(data.sceneId) ?? canvas?.scene;
          const tokenDoc = scene?.tokens?.get(data.tokenId) ?? canvas?.tokens?.get(data.tokenId)?.document;
          if (!tokenDoc) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.TokenNotFound") || "Token not found.");
          }

          const actor = tokenDoc.actor;
          if (!actor) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.ActorNotFound") || "Actor not available for token.");
          }

          const effectData = data.effectData;
          if (!effectData) {
            return ui.notifications.error(game.i18n.localize("DRAW_STEEL.UI.EffectNotFound") || "Effect not found.");
          }

          await actor.createEmbeddedDocuments("ActiveEffect", [effectData], { keepId: Boolean(data.keepId) });

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
    const gmIds = game.users.filter((user) => user.isGM).map((user) => user.id);
    if (!gmIds.length) return;

    const payload = {
      sceneId,
      tokenId,
      effectData,
      keepId,
    };

    const safeTokenName = escapeHtml(tokenName);
    const safeEffectName = escapeHtml(effectName);
    const label = game.i18n.localize("DRAW_STEEL.UI.ApplyEffect") || "Apply Effect";
    const requestLine = game.i18n.localize?.("DRAW_STEEL.UI.RequestGMApplyLine") || "Permission request for token:";
    const effectLine = game.i18n.localize?.("DRAW_STEEL.UI.EffectLabel") || "Effect";

    const content = `
      <div class="ds-gm-apply">
        <p><strong>${requestLine}</strong> ${safeTokenName}</p>
        <p>${effectLine}: <strong>${safeEffectName}</strong></p>
        <button type="button"
          class="ds-apply-effect-gm"
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
    schema.uuid = new fields.DocumentUUIDField({ nullable: false, type: "Item" });
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
      }: </strong>${item.system.power.effects.sortedContents.map(effect => effect.toText(this.tier)).filter(_ => _).join("; ")}</p>`,
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
    for (const effectButton of effectButtons) effectButton.addEventListener("click", async () => {
      /** @type {AppliedPowerRollEffect} */
      const pre = await fromUuid(effectButton.dataset.uuid);
      if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoPRE", { localize: true });
      const effectId = effectButton.dataset.effectId;
      const config = pre.applied[this.tierKey].effects[effectId];

      const noStack = !config.properties.has("stacking");

      const isStatus = effectButton.dataset.type === "status";

      /** @type {DrawSteelActiveEffect} */
      const tempEffect = isStatus ?
        await DrawSteelActiveEffect.fromStatusEffect(effectId) :
        pre.item.effects.get(effectId).clone({}, { keepId: noStack, addSource: true });

      /** @type {ActiveEffectData} */
      const updates = {
        transfer: true,
        // v14 is turning this into a DocumentUUID field so needs to be a real document
        origin: pre.item.uuid,
        system: {},
      };
      if (config.end) updates.system.end = { type: config.end };
      tempEffect.updateSource(updates);

      if (!game.user?.targets?.size) {
        return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
      }

      const user = game.user;
      const targetTokens = [...user.targets].filter((token) => token?.document && token.actor);
      if (!targetTokens.length) {
        return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoTokenTargeted", { localize: true });
      }

      const ModelClass = this.constructor;
      ModelClass._registerGMApplyButtonHookOnce();

      const effectData = tempEffect.toObject();
      const { controllable, restricted } = partitionTokensByOwnership(targetTokens, user);

      const ownedActors = new Map();
      for (const token of controllable) {
        const actor = token.actor;
        if (!actor) continue;
        const key = actor.uuid ?? actor.id ?? actor._id ?? token.id ?? foundry.utils.randomID();
        if (!ownedActors.has(key)) ownedActors.set(key, actor);
      }

      for (const actor of ownedActors.values()) {
        // reusing the ID will block creation if it's already on the actor
        // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
        await actor.createEmbeddedDocuments("ActiveEffect", [foundry.utils.duplicate(effectData)], { keepId: noStack });
      }

      for (const token of restricted) {
        await ModelClass._whisperGMApplyButton({
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

  /* -------------------------------------------------- */

  /**
   * Create a new DamageRoll based on applying modifications to a given DamageRoll.
   * After creation, the new roll is added to the message rolls.
   * @param {DamageRoll} roll The damage roll to modify.
   * @param {object} modifications The modification options to apply.
   * @param {string} [modifications.additionalTerms] Additional formula components to append to the roll.
   * @param {string} [modifications.damageType] The damage type to use for the modified roll.
   * @param {object} [evaluationOptions={}] Options passed to the DamageRoll#evaluate.
   * @returns {DamageRoll}
   */
  async createModifiedDamageRoll(roll, { additionalTerms = "", damageType }, evaluationOptions = {}) {
    const ability = await fromUuid(this.uuid);
    const rollData = ability?.getRollData() ?? this.parent.getRollData();

    const newRoll = DamageRoll.fromData(roll.toJSON());

    if (additionalTerms) {
      const terms = DamageRoll.parse(additionalTerms, rollData);
      for (const term of terms) if (!term._evaluated) await term.evaluate(evaluationOptions);
      newRoll.terms = newRoll.terms.concat(new foundry.dice.terms.OperatorTerm({ operator: "+" }), terms);
      newRoll.resetFormula();
      newRoll._total = newRoll._evaluateTotal();
    }

    if (damageType !== undefined) {
      // Without this, changing the new roll damage type changes the original rolls damage type.
      newRoll.options = { ...newRoll.options };
      newRoll.options.type = damageType;
      const damageLabel = ds.CONFIG.damageTypes[damageType]?.label ?? damageType ?? "";
      const flavor = game.i18n.format("DRAW_STEEL.Item.ability.DamageFlavor", { type: damageLabel });
      newRoll.options.flavor = flavor;
    }

    await this.parent.update({ rolls: this.parent.rolls.concat(newRoll) });

    return newRoll;
  }
}
