
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

      // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
      for (const actor of ds.utils.tokensToActors()) {
        if (isStatus) {
          // reusing the ID will block creation if it's already on the actor
          const existing = actor.effects.get(tempEffect.id);
          // deleting instead of updating because there may be variances between the old copy and new
          if (existing && existing.disabled) await existing.delete();
        }
        // not awaited to allow parallel processing
        actor.createEmbeddedDocuments("ActiveEffect", [tempEffect.toObject()], { keepId: noStack });
      }
    });
  }
}
