import BaseMessageModel from "./base.mjs";
/** @import AbilityModel from "../item/ability.mjs" */
/** @import { DrawSteelItem } from "../../documents/_module.mjs" */

const fields = foundry.data.fields;

/**
 * Chat messages representing the result of {@link AbilityModel#use}
 */
export default class AbilityUseModel extends BaseMessageModel {
  static metadata = Object.freeze({
    type: "abilityUse"
  });

  static defineSchema() {
    const schema = super.defineSchema();
    // All ability use messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({required: true, nullable: false, blank: false});
    schema.embedText = new fields.BooleanField({initial: true});
    return schema;
  }

  /**
   * @param {HTMLLIElement} html The pending HTML
   */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);

    // First roll is always the base roll, second is the result. Only one tier per message.
    /** @type {1 | 2 | 3} */
    const tier = this.parent.rolls[1]?.product;

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
      content.insertAdjacentHTML("afterbegin", `<p><strong>${
        game.i18n.localize(`DRAW_STEEL.Roll.Power.Results.Tier${tier}`)
      }: </strong>${item.system.powerRoll[`tier${tier}`].description}</p>`
      );
    } else console.warn("Invalid configuration");
  }
}
