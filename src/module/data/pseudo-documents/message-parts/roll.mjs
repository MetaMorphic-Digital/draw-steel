import { systemPath } from "../../../constants.mjs";
import DamageRoll from "../../../rolls/damage.mjs";
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

  static ACTIONS = {
    applyDamage: (event) => DamageRoll.applyDamageCallback(event),
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/roll.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.ctx.buttons = [];

    for (let i = 0; i < this.rolls.length; i++) {
      const roll = this.rolls[i];
      if (roll instanceof DamageRoll) context.ctx.buttons.push(roll.toRollButton(i));
    }
  }
}
