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
    return schema;
  }

  /**
   * @param {HTMLLIElement} html The pending HTML
   */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem} */
    const item = await fromUuid(this.uuid);

    let embed;
    if (item) embed = await item.toEmbed({});
    else {
      embed = document.createElement("p");
      embed.innerText = game.i18n.localize("DRAW_STEEL.Item.Ability.EmbedFail");
    }

    const content = html.querySelector(".message-content");
    content.insertAdjacentElement("afterbegin", embed);
  }
}
