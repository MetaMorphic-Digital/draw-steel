import DamageRoll from "../../rolls/damage.mjs";
import BaseMessageModel from "./base.mjs";

/** @import AbilityModel from "../item/ability.mjs" */
/** @import DrawSteelItem from "../../documents/item.mjs" */

const fields = foundry.data.fields;

/**
 * Chat messages representing the result of {@linkcode AbilityModel.use}
 */
export default class AbilityUseModel extends BaseMessageModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    type: "abilityUse",
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();
    // All ability use messages MUST have a uuid pointing to the relevant document
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });
    schema.embedText = new fields.BooleanField({ initial: true });
    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    /** @type {DrawSteelItem & { system: AbilityModel}} */
    const item = await fromUuid(this.uuid);

    // First roll is always the base roll, second is the result. Only one tier per message.
    /** @type {1 | 2 | 3} */
    const tier = this.parent.rolls[1]?.product;

    /** @type {HTMLDivElement} */
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _constructFooterButtons() {
    const buttons = await super._constructFooterButtons();
    buttons.push(...this._constructDamageFooterButtons());

    return buttons;
  }

  /* -------------------------------------------------- */

  /**
   * Create an array of damage buttons based on each {@linkcode DamageRoll} in this message's rolls.
   * @returns {HTMLButtonElement[]}
   * @protected
   */
  _constructDamageFooterButtons() {
    return this.parent.rolls.filter(roll => roll instanceof DamageRoll).map(r => r.toRollButton());
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  addListeners(html) {
    super.addListeners(html);
    const damageButtons = html.querySelectorAll(".apply-damage");
    for (const damageButton of damageButtons) damageButton.addEventListener("click", (event) => DamageRoll.applyDamageCallback(event));
  }
}
