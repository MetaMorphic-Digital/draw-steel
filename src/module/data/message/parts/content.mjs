import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";
import MessagePart from "./base.mjs";

/**
 * A simple part that displays the enriched HTML of the `ChatMessage#content` property.
 */
export default class ContentPart extends MessagePart {
  /** @inheritdoc */
  static TYPE = "content";

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
