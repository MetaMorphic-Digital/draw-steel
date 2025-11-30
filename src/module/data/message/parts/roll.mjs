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
}
