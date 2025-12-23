import { systemPath } from "../../../constants.mjs";
import BaseMessagePart from "./base-message-part.mjs";

const { DocumentUUIDField } = foundry.data.fields;

/**
 * A part that contains a saving throw and any associated buttons.
 */
export default class SavingThrowPart extends BaseMessagePart {
  /** @inheritdoc */
  static get TYPE() {
    return "savingThrow";
  }

  /* -------------------------------------------------- */

  static ACTIONS = {
    heroToken: this.#heroToken,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/saving-throw.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      effectUuid: new DocumentUUIDField({ nullable: false, type: "ActiveEffect" }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the effect from the UUID. Can return null if the effect no longer exists.
   * @returns {DrawSteelActiveEffect | null}
   */
  get effect() {
    return fromUuidSync(this.effectUuid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    context.ctx.buttons = [];
    const effect = this.effect;

    // Strictly GM-owned actors shouldn't have this option, and should only show if you have effect perms
    if (effect?.hasPlayerOwner && effect?.isOwner) {
      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        action: "heroToken",
        label: game.i18n.localize("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.Label"),
        icon: "fa-solid fa-shield",
        classes: ["hero-token"],
        dataset: {
          action: "heroToken",
          tooltip: game.i18n.localize("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.Tooltip"),
        },
        disabled: effect.disabled,
      }));
    }
  }

  /* -------------------------------------------------- */

  /**
   * Expend a hero token to succeed on the saving throw.
   *
   * @this SavingThrowPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #heroToken(event, target) {const effect = this.effect;
    if (!effect) {
      ui.notifications.error("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.NoEffect", { localize: true });
      return;
    }
    if (!effect.isOwner) {
      ui.notifications.error("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.NoOwner", { localize: true });
      return;
    }

    const token = await game.actors.heroTokens.spendToken("succeedSave", { messageId: this.message.id });

    if (token !== false) {
      await effect.update({ disabled: true });
      return ui.chat.updateMessage(this.message);
    }
  }
}
