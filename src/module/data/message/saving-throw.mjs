import BaseMessageModel from "./base.mjs";

/** @import { SavingThrowRoll } from "../../rolls/saving-throw.mjs" */
/** @import DrawSteelActiveEffect from "../../documents/active-effect.mjs"; */

const fields = foundry.data.fields;

/**
 * Chat Messages representing the result of a {@linkcode SavingThrowRoll}.
 */
export default class SavingThrowModel extends BaseMessageModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      type: "savingThrow",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // Fully Mandatory field
    schema.effectUuid = new fields.DocumentUUIDField({ nullable: false, type: "ActiveEffect" });
    return schema;
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
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    const effect = this.effect;

    if (!effect) return;

    /** @type {HTMLDivElement} */
    const content = html.querySelector(".message-content");

    const embed = await effect.toEmbed({
      caption: true,
      // Needed to avoid extra "null", see https://github.com/foundryvtt/foundryvtt/issues/12935
      captionPosition: "",
    });

    content.insertAdjacentElement("afterbegin", embed);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    const effect = this.effect;

    if (!effect) return buttons;

    // Strictly GM-owned actors shouldn't have this option, and should only show if you have effect perms
    if (effect.hasPlayerOwner && effect.isOwner) {
      const heroToken = ds.utils.constructHTMLButton({
        label: game.i18n.localize("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.Label"),
        icon: "fa-solid fa-shield",
        classes: ["hero-token"],
        dataset: {
          tooltip: game.i18n.localize("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.Tooltip"),
        },
        disabled: effect.disabled,
      });

      buttons.push(heroToken);
    }

    return buttons;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);
    html.querySelector(".hero-token")?.addEventListener("click", async (event) => {
      const effect = this.effect;

      if (!effect) {
        ui.notifications.error("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.NoEffect", { localize: true });
        return;
      }
      if (!effect.isOwner) {
        ui.notifications.error("DRAW_STEEL.ChatMessage.savingThrow.Buttons.HeroToken.NoOwner", { localize: true });
        return;
      }

      const token = await game.actors.heroTokens.spendToken("succeedSave");

      if (token !== false) {
        await effect.update({ disabled: true });
        return ui.chat.updateMessage(this.parent);
      }
    });
  }
}
