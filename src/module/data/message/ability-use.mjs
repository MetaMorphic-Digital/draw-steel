import BaseMessageModel from "./base.mjs";

const fields = foundry.data.fields;

/**
 * Chat messages with message
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

    // Append normal roll content
    const renderRolls = async isPrivate => {
      let html = "";
      for (const r of this.parent.rolls) {
        html += await r.render({isPrivate});
      }
      return html;
    };

    const rollHTML = await renderRolls(!this.parent.isContentVisible);
    const content = html.querySelector(".message-content");
    content.insertAdjacentHTML("beforeend", rollHTML);
  }
}
