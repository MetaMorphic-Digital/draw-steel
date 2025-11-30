import MessagePart from "./base.mjs";
import { systemPath } from "../../../constants.mjs";
import enrichHTML from "../../../utils/enrich-html.mjs";

const { SchemaField, HTMLField } = foundry.data.fields;

/**
 * A part containing a Test roll and.
 */
export default class TestPart extends MessagePart {
  /**
   * Standard click event listeners.
   * @type {Record<string, Function>}
   */
  static ACTIONS = {
    ...super.ACTIONS,
    heroReroll: this.#heroReroll,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "test";

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

    context.buttons = [];

    const lastTestPart = this.parent.parts.findLast(p => p.type === this.type) === this;

    if (lastTestPart && (this.message.speakerActor?.type === "hero")) {
      context.buttons.push({
        label: "DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.label",
        icon: "dice-d10",
        tooltip: "DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.tooltip",
        action: "heroReroll",
      });
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
    const token = await game.actors.heroTokens.spendToken("rerollTest");

    if (token === false) return;

    const newRoll = await this.rolls[0].reroll();

    Object.assign(newRoll.options, {
      baseRoll: false,
      flavor: game.i18n.localize("DRAW_STEEL.ChatMessage.PARTS.test.HeroTokenReroll.flavor"),
    });

    const newPart = this.toObject();

    newPart.rolls = [newRoll];

    await this.message.update({ "system.parts": this.message.system.parts.concat(newPart) });
  }
}
