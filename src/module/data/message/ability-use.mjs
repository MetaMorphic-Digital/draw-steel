
import BaseMessageModel from "./base.mjs";
import DrawSteelActiveEffect from "../../documents/active-effect.mjs";
import DamageRoll from "../../rolls/damage.mjs";

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

      for (const actor of ds.utils.tokensToActors()) {
        // reusing the ID will block creation if it's already on the actor
        // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
        actor.createEmbeddedDocuments("ActiveEffect", [tempEffect.toObject()], { keepId: noStack });
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
   * @returns {DamageRoll}
   */
  async createModifiedDamageRoll(roll, { additionalTerms = "", damageType }) {
    const ability = await fromUuid(this.uuid);
    const rollData = ability?.getRollData() ?? this.parent.speakerActor?.getRollData() ?? {};

    const formula = additionalTerms ? `${roll.total} + ${additionalTerms}` : String(roll.total);
    const options = { ...roll.options };
    if (damageType) options.type = damageType;

    const newRoll = new DamageRoll(formula, rollData, options);
    await newRoll.evaluate();

    this.parent.update({ rolls: [...this.parent.rolls, newRoll] });

    return newRoll;
  }

  /**
   * Spend the speaker actor's surges.
   * @param {number} surges The new resource value.
   * @returns {DrawSteelActor}
   */
  async spendSurges(surges) {
    if (this.parent.speakerActor?.type !== "hero") return this.parent.speakerActor;

    const oldSurges = this.parent.speakerActor.system.hero.surges;
    const newSurges = Math.max(0, oldSurges - surges);

    return this.parent.speakerActor.update({ "system.hero.surges": newSurges });
  }
}
