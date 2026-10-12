import BaseMessagePart from "./base-message-part.mjs";
import DamageRoll from "../../../rolls/damage.mjs";
import { systemPath } from "../../../constants.mjs";

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
  static ACTIONS = {
    ...super.ACTIONS,
    applyDamage: (event) => DamageRoll.applyDamageCallback(event),
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/roll.hbs");
}
