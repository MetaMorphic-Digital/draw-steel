import BaseMessagePart from "./base-message-part.mjs";
import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";

const { DocumentUUIDField } = foundry.data.fields;

/**
 * A part containing a Test roll and possible result text.
 */
export default class TestPart extends BaseMessagePart {
  /**@inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    heroReroll: this.#heroReroll,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "test";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/test.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.resultSource = new DocumentUUIDField();

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    // const testRoll = this.rolls[0];

    // const resultSource = await fromUuid(this.resultSource);

    // TODO: Populate `context.resultHTML` with info from resultSource

    context.ctx.buttons = [];

    const lastTestPart = this.parent.parts.sortedContents.findLast(p => p.type === this.type) === this;

    if (this.message.isOwner && lastTestPart && (this.message.speakerActor?.type === "hero")) {
      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.label"),
        icon: "fa-solid fa-dice-d10",
        dataset: {
          tooltip: "DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.tooltip",
          action: "heroReroll",
        },
      }));
    }
  }

  /* -------------------------------------------------- */

  /**
   * Reroll this test while expending a hero token.
   *
   * @this TestPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #heroReroll(event, target) {
    await this.reroll({ spendToken: true });
  }

  /* -------------------------------------------------- */

  /**
   * Reroll this test.
   * @param {object} [options={}]
   * @param {boolean} [options.spendToken] Should a hero token be spent as part of this reroll?
   * @returns {Promise<true | false>} Returns true if the reroll was performed or false if it wasn't.
   */
  async reroll(options = {}) {

    const newRoll = await this.rolls[0].reroll();

    if (options.spendToken) {
      const token = await game.actors.heroTokens.spendToken("rerollTest", { messageId: this.message.id });

      if (token === false) return false;

      newRoll.options = { ...newRoll.options, flavor: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.flavor") };
    }

    const rolls = this.rolls.concat(newRoll);

    await this.update({ rolls }, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });

    return true;
  }
}
