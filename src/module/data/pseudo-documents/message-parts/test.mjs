import BaseMessagePart from "./base-message-part.mjs";
import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";

const { SchemaField, HTMLField } = foundry.data.fields;

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

    schema.results = new SchemaField({
      tier1: new HTMLField(),
      tier2: new HTMLField(),
      tier3: new HTMLField(),
      critical: new HTMLField(),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const testRoll = this.rolls[0];

    if (testRoll.isCritical && this.results.critical) context.resultHTML = await enrichHTML(this.results.critical);
    else context.resultHTML = await enrichHTML(this.results[`tier${testRoll.product}`]);

    context.ctx.buttons = [];

    const lastTestPart = this.parent.parts.sortedContents.findLast(p => p.type === this.type) === this;

    if (lastTestPart && (this.message.speakerActor?.type === "hero")) {
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
    const token = await game.actors.heroTokens.spendToken("rerollTest", { messageId: this.message.id });

    if (token === false) return;

    const newRoll = await this.rolls[0].reroll();

    Object.assign(newRoll.options, {
      flavor: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.flavor"),
    });

    await this.update({ rolls: this.rolls.concat(newRoll) });
  }
}
