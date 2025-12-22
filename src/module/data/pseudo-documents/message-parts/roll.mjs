import { systemPath } from "../../../constants.mjs";
import BaseMessagePart from "./base-message-part.mjs";

/**
 * A simple part that displays the contained rolls.
 */
export default class RollPart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "roll";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/roll.hbs");
}
