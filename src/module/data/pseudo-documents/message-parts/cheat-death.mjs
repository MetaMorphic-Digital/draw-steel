import ContentPart from "./content.mjs";
import { DrawSteelChatMessage } from "../../../documents/_module.mjs";
import RollPart from "./roll.mjs";
import { systemPath } from "../../../constants.mjs";

/** 
* @import DrawSteelToken from "../../../canvas/placeables/token.mjs";
*/

const { DocumentUUIDField, NumberField } = foundry.data.fields;
/**
* A part that displays details about a potential death and offers options.
*/
export default class DeathPart extends RollPart {
  /** @inheritdoc */
  static get TYPE() {
    return "cheatDeath";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    recoverStamina: this.#recoverStamina,
    acceptDeath: this.#acceptDeath,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      uuids: new DocumentUUIDField({ nullable: false, type: "Actor" }),
      death: new NumberField(),
      recovery: new NumberField(),
      tokens: new NumberField(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/cheat-death.hbs");

  /* -------------------------------------------------- */

  /**
   * The token of the actor ending the turn, or null if unavailable.
   * @type {DrawSteelToken | null}
   */
  get actor() {
    return fromUuidSync(this.uuids) ?? null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    if (this.actorTarget) {
      context.ctx.staminaWarning = _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.explain", { hero: this.actor.name, endHealth: this.death });
      context.ctx.tokenCounter = _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.tokenCounter", { tokens: this.tokens, value: this.recovery });
      
      if (this.actorTarget.isOwner) {
        context.ctx.buttons.push(
          ds.utils.constructHTMLButton({
            label: _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.Buttons.yes"),
            icon: "fa-solid fa-heart-pulse",
            dataset: {
              action: "recoverStamina",
            },
          }),
          ds.utils.constructHTMLButton({
            label: _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.Buttons.no"),
            icon: "fa-solid fa-skull",
            dataset: {
              action: "acceptDeath",
            },
          }),
        );
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Recoover Stamina using the hero's inbuilt function.
   * @param {PointerEvent} event    The originating click event.
   */
  static #recoverStamina(event) {
    this.actorTarget.system.spendStaminaHeroToken();
  }

  /* -------------------------------------------------- */

  /**
   * Accept the Hero's death, presenting a message.
   * @param {PointerEvent} event    The originating click event. 
   */
  static #acceptDeath(event) {
    ContentPart.create({
      type: "content",
      flavor: _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.Buttons.no", { hero: this.actor.name }),
    }, { parent: this.message });
  }
}
