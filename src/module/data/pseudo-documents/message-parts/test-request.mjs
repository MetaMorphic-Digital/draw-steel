import { systemPath } from "../../../constants.mjs";
import { setOptions } from "../../helpers.mjs";
import BaseMessagePart from "./base-message-part.mjs";

const { BooleanField, DocumentUUIDField, NumberField, SetField, StringField } = foundry.data.fields;

/**
 * A part that represents a request by the Director to the Players to perform a test.
 */
export default class TestRequestPart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "testRequest";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    rollTest: this.#rollTest,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/test-request.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    Object.assign(schema, {
      characteristics: new SetField(setOptions()),
      difficulty: new StringField(),
      edges: new NumberField(),
      banes: new NumberField(),
      resultSource: new DocumentUUIDField(),
      revealResult: new BooleanField(),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    context.ctx.buttons ??= [];

    // Result source is expected to be a Power Roll Tier Outcomes page.
    const resultSource = await fromUuid(this.resultSource);

    const showResult = this.revealResult || game.user.isGM;

    if (showResult && (resultSource?.documentName === "JournalEntryPage") && (resultSource?.type === "tierOutcome")) {
      const embed = await resultSource.toEmbed({ inline: true });

      context.ctx.resultHTML = embed?.outerHTML;
      context.ctx.revealClass = this.revealResult ? "revealed" : "";
    }

    for (const chr of this.characteristics) {
      const characteristic = ds.CONFIG.characteristics[chr]?.label ?? "";

      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        label: game.i18n.format("DRAW_STEEL.ChatMessage.PARTS.abilityUse.performTest", { characteristic }),
        icon: "fa-solid fa-dice-d10",
        dataset: {
          chr,
          action: "rollTest",
        },
      }));
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _addListeners(element, context) {
    super._addListeners(element, context);

    element.addEventListener("change", ev => {
      if (ev.target instanceof foundry.applications.elements.HTMLSecretBlockElement) {
        ev.stopPropagation();
        if (this.message.isOwner) this.update({ revealResult: !this.revealResult });
      }
    });
  }

  /* -------------------------------------------------- */

  /**
   * Perform the linked test with all actors.
   *
   * @this TestRequestPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollTest(event, target) {
    const { chr } = target.dataset;

    const resultSource = this.revealResult ? this.resultSource : "";

    for (const actor of ds.utils.tokensToActors()) {
      actor.rollCharacteristic(chr, { resultSource, edges: this.edges, banes: this.banes, difficulty: this.difficulty });
    }
  }
}
