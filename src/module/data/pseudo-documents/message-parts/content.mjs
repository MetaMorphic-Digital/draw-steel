import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import BaseMessagePart from "./base-message-part.mjs";

/**
 * A simple part that displays the enriched HTML of the `ChatMessage#content` property.
 */
export default class ContentPart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "content";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/content.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.enrichedHTML = await enrichHTML(this.message.content, {
      rollData: context.rollData,
      secrets: this.message.speakerActor?.isOwner ?? game.user.isGM,
    });
  }
}
