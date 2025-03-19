import { constructHTMLButton } from "../../helpers/utils.mjs";
import { DamageRoll } from "../../rolls/damage.mjs";
import BaseMessageModel from "./base.mjs";

/** @import AbilityModel from "../item/ability.mjs" */
/** @import DrawSteelItem from "../../documents/item.mjs" */

const fields = foundry.data.fields;

/**
 * Chat messages representing the result of {@link AbilityModel#use}
 */
export default class AbilityUseModel extends BaseMessageModel {
  static metadata = Object.freeze({
    type: "abilityUse",
  });

  static defineSchema() {
    const schema = super.defineSchema();
    // All ability use messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });
    schema.embedText = new fields.BooleanField({ initial: true });
    return schema;
  }

  /**
   * @param {HTMLLIElement} html The pending HTML
   */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);

    // First roll is always the base roll, second is the result. Only one tier per message.
    /** @type {1 | 2 | 3} */
    const tier = this.parent.rolls[1]?.product;

    const content = html.querySelector(".message-content");

    if (this.embedText) {
      /** @type {HTMLDivElement} */
      let embed;
      if (item) {
        const embedConfig = {};
        if (tier) embedConfig[`tier${tier}`] = true;
        embed = await item.toEmbed(embedConfig);
      }
      else {
        embed = document.createElement("p");
        embed.innerText = game.i18n.localize("DRAW_STEEL.Item.Ability.EmbedFail");
      }

      // If it's a roll, the roll rendering will replace the message's stored content. Otherwise we need to do it.
      if (this.parent.isRoll) content.insertAdjacentElement("afterbegin", embed);
      else content.innerHTML = embed.outerHTML;
    } else if (item && tier) {
      content.insertAdjacentHTML("afterbegin", `<p class="powerResult"><strong>${
        game.i18n.localize(`DRAW_STEEL.Roll.Power.Results.Tier${tier}`)
      }: </strong>${item.system.powerRoll[`tier${tier}`].display}</p>`,
      );
    } else console.warn("Invalid configuration");
  }

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();
    buttons.push(...this._constructDamageFooterButtons());

    return buttons;
  }

  /**
   * Create an array of damage buttons based on each {@link DamageRoll} in this message's rolls.
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  _constructDamageFooterButtons() {
    const damageButtons = [];
    const damageRolls = this.parent.rolls.filter(roll => roll instanceof DamageRoll);
    for (const roll of damageRolls) {
      const typeLabel = ds.CONFIG.damageTypes[roll.options.type]?.label ?? "";
      const button = constructHTMLButton({
        label: game.i18n.format("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Label", {
          type: typeLabel ? " " + typeLabel : "",
          amount: roll.total,
        }),
        dataset: {
          type: roll.options.type,
          amount: roll.total,
          tooltip: game.i18n.localize("DRAW_STEEL.Messages.AbilityUse.Buttons.ApplyDamage.Tooltip"),
          tooltipDirection: "UP",
        },
        classes: ["apply-damage"],
        icon: "fa-solid fa-burst",
      });

      damageButtons.push(button);
    }

    return damageButtons;
  }

  /** @inheritdoc */
  addListeners(html) {
    const damageButtons = html.querySelectorAll(".apply-damage");
    for (const damageButton of damageButtons) {
      damageButton.addEventListener("click", async (event) => {
        if (!canvas.tokens.controlled.length) return ui.notifications.error("DRAW_STEEL.Messages.AbilityUse.NoTokenSelected", { localize: true });

        const type = event.target.dataset.type;
        let amount = Number(event.target.dataset.amount);
        if (event.shiftKey) amount = Math.floor(amount / 2);

        for (const token of canvas.tokens.controlled) {
          await token.actor?.system.takeDamage(amount, { type });
        }
      });
    }
  }
}
