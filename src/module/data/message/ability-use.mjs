
import BaseMessageModel from "./base.mjs";

/**
 * @import AbilityModel from "../item/ability.mjs";
 * @import AppliedPowerRollEffect from "../pseudo-documents/power-roll-effects/applied-effect.mjs";
 * @import DrawSteelItem from "../../documents/item.mjs"
 */

const fields = foundry.data.fields;

/**
 * Chat messages representing the result of {@linkcode AbilityModel.use}
 */
export default class AbilityUseModel extends BaseMessageModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    type: "abilityUse",
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // All ability use messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });
    schema.embedText = new fields.BooleanField({ initial: true });
    return schema;
  }

  /**
   * The displayed result tier
   * @type {1 | 2 | 3 | undefined}
   */
  get tier() {
    // First roll is always the base roll, second is the result. Only one tier per message.
    return this.parent.rolls[1]?.product;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);

    const tier = this.tier;

    /** @type {HTMLDivElement} */
    const content = html.querySelector(".message-content");

    if (this.embedText) {
      /** @type {HTMLDivElement} */
      let embed;
      if (item) {
        const embedConfig = {};
        if (tier) embedConfig[`tier${tier}`] = true;
        embed = await item.toEmbed(embedConfig);
      }
      else {
        embed = document.createElement("p");
        embed.innerText = game.i18n.localize("DRAW_STEEL.Item.Ability.EmbedFail");
      }

      // If it's a roll, the roll rendering will replace the message's stored content. Otherwise we need to do it.
      if (this.parent.isRoll) content.insertAdjacentElement("afterbegin", embed);
      else content.innerHTML = embed.outerHTML;
    } else if (item && tier) {
      content.insertAdjacentHTML("afterbegin", `<p class="powerResult"><strong>${
        game.i18n.localize(`DRAW_STEEL.Roll.Power.Results.Tier${tier}`)
      }: </strong>${item.system.powerRoll[`tier${tier}`].display}</p>`,
      );
    } else console.warn("Invalid configuration");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();
    const tier = this.tier;
    if (!tier) return buttons;
    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);
    for (const pre of item.system.power.effects) {
      const newButtons = await pre.constructButtons(tier);
      if (newButtons) buttons.push(...newButtons);
    }
    return buttons;
  }

  /* -------------------------------------------------- */

  /**
   *
   * @param {HTMLButtonElement[]} buttons
   * @param {AppliedPowerRollEffect} pre
   */
  async _constructApplyEffectButtons(buttons, pre) {
    const n = this.tier;
    const item = await fromUuid(this.uuid);
    if (n) {
      for (const [key, data] of Object.entries(pre.applied[`tier${n}`].effects)) {
        const effect = this.item;
        ds.utils.constructHTMLButton({

        });
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);
  }
}
