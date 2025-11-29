import { systemPath } from "../../../constants.mjs";
import MessagePart from "./base.mjs";

/**
 * A simple part that displays the contained rolls.
 */
export default class RollPart extends MessagePart {
  /** @inheritdoc */
  static TYPE = "roll";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/roll.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.rollHTML = "";

    for (const roll of this.rolls) {
      context.rollHTML += await roll.render({ message: this.message });
    }
  }
}
