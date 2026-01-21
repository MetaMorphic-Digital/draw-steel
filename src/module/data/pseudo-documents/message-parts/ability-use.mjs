import { systemPath } from "../../../constants.mjs";
import BaseMessagePart from "./base-message-part.mjs";

/**
 * @import DrawSteelItem from "../../../documents/item.mjs";
 * @import AbilityData from "../../item/ability.mjs";
 */

const { DocumentUUIDField } = foundry.data.fields;

/**
 * A part that displays the main text of the ability.
 */
export default class AbilityUsePart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "abilityUse";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    rollTest: this.#rollTest,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/ability-use.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilityUuid: new DocumentUUIDField({ nullable: false, type: "Item" }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the ability from the UUID. Can return null if the effect no longer exists.
   * @type {Omit<DrawSteelItem, "system"> & { system: AbilityData } | null}
   */
  get ability() {
    return fromUuidSync(this.abilityUuid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const item = this.ability;

    if (!item) {
      context.ctx.embed = document.createElement("p");
      context.ctx.embed.innerText = game.i18n.localize("DRAW_STEEL.Item.ability.EmbedFail");
      return;
    }

    const embedConfig = {
      tier1: false,
      tier2: false,
      tier3: false,
    };
    context.ctx.embed = await item.toEmbed(embedConfig);

    context.ctx.buttons = [];

    if (item.system.power.roll.reactive) {
      for (const chr of item.system.power.roll.characteristics) {
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
  }

  /* -------------------------------------------------- */

  /**
   * Perform the linked test with all actors.
   *
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #rollTest(event, target) {
    const { chr } = target.dataset;

    for (const actor of ds.utils.tokensToActors()) {
      actor.rollCharacteristic(chr, { resultSource: this.abilityUuid });
    }
  }
}
