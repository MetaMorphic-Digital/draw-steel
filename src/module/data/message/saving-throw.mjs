import BaseMessageModel from "./base.mjs";

/** @import { SavingThrowRoll } from "../../rolls/savingThrow.mjs" */
/** @import DrawSteelActiveEffect from "../../documents/active-effect.mjs"; */

const fields = foundry.data.fields;

/**
 * Chat Messages representing the result of a {@linkcode SavingThrowRoll}
 */
export default class SavingThrowModel extends BaseMessageModel {
  static metadata = Object.freeze({
    type: "savingThrow",
  });

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // Fully Mandatory field
    schema.effect = new fields.DocumentUUIDField({ nullable: false, type: "ActiveEffect" });
    return schema;
  }

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();

    /** @type {DrawSteelActiveEffect} */
    const effect = await fromUuid(this.effect);

    const heroToken = ds.utils.constructHTMLButton({
      label: game.i18n.localize("DRAW_STEEL.Messages.SavingThrow.Buttons.HeroToken.Label"),
      icon: "fa-solid fa-shield",
      classes: ["hero-token"],
      dataset: {
        tooltip: game.i18n.localize("DRAW_STEEL.Messages.SavingThrow.Buttons.HeroToken.Tooltip"),
      },
      disabled: effect.disabled,
    });

    buttons.push(heroToken);

    return buttons;
  }

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);
    html.querySelector(".hero-token").addEventListener("click", async (event) => {
      const effect = await fromUuid(this.effect);

      const token = await game.actors.heroTokens.spendToken("succeedSave");

      if (token !== false) {
        await effect.update({ disabled: true });
        return ui.chat.updateMessage(this.parent);
      }
    });
  }
}
