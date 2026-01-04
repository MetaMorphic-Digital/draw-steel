import { systemPath } from "../../../constants.mjs";
import BaseMessagePart from "./base-message-part.mjs";

const { StringField } = foundry.data.fields;

/**
 * A part that contains a hero token expenditure message.
 */
export default class HeroTokenPart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "heroToken";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/hero-token.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      spendType: new StringField({ required: true, blank: false }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.ctx.heroTokenMessage = ds.CONFIG.hero.tokenSpends[this.spendType]?.messageContent ?? "DRAW_STEEL.Setting.HeroTokens.UnknownType";
  }
}
