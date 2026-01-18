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
    applyEffect: this.#applyEffect,
    gainResource: this.#gainResource,
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

    const resultSource = await fromUuid(this.resultSource);

    if (resultSource) {
      const latestRoll = this.rolls.at(-1);

      if (typeof resultSource.system?.powerRollText === "function") context.resultHTML = resultSource.system.powerRollText(latestRoll.product);

      if ((resultSource.documentName === "Item") && (resultSource.type === "ability")) {
        for (const pre of resultSource.system.power.effects) {
          const newButtons = pre.constructButtons(latestRoll.product);
          if (newButtons) context.ctx.buttons.push(...newButtons);
        }
      }
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

  /* -------------------------------------------------- */

  /**
     * Apply an effect to the selected actor.
     *
     * @this TestPart
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     */
  static async #applyEffect(event, target) {
    /** @type {AppliedPowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.NoPRE", { localize: true });

    const latestRoll = this.rolls.at(-1);

    const tierKey = `tier${latestRoll.product}`;

    await pre.applyEffect(tierKey, target.dataset.effectId);
  }

  /* -------------------------------------------------- */

  /**
     * Apply an effect to the selected actor.
     *
     * @this TestPart
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     */
  static async #gainResource(event, target) {
    /** @type {GainResourcePowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.NoPRE", { localize: true });

    const latestRoll = this.rolls.at(-1);

    const tierKey = `tier${latestRoll.product}`;

    await pre.applyGain(tierKey);
  }

}
