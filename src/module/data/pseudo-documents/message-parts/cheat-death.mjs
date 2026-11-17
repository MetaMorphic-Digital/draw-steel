import ContentPart from "./content.mjs";
import DamageRoll from "../../../rolls/damage.mjs";
import { DrawSteelChatMessage } from "../../../documents/_module.mjs";
import RollPart from "./roll.mjs";
import { systemPath } from "../../../constants.mjs";

/** 
* @import DrawSteelToken from "../../../canvas/placeables/token.mjs";
* @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs"
*/
const { DocumentUUIDField, NumberField } = foundry.data.fields;
const { createFormGroup, createNumberInput, createTextInput } = foundry.applications.fields;
/**
* A part that displays details about a potential death and offers options.
*/
export default class DeathPart extends RollPart {
  
  /** @inheritdoc */
  static get TYPE() {
    return "cheatDeath";
  }
  
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
      heroUuid: new DocumentUUIDField({ nullable: false, type: "Actor" }),
      endStamina: new NumberField(),
      recoveryValue: new NumberField(),
      currentTokens: new NumberField(),
    });
  }

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/cheat-death.hbs");

  /**
   * The token of the actor ending the turn, or null if unavailable.
   * @type {DrawSteelToken | null}
   */
  get actorTarget() {
    return fromUuidSync(this.heroUuid) ?? null;
  }

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    if (this.actorTarget)
    {
      context.ctx.staminaWarning = _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.explain", { hero: this.actorTarget.name, endHealth: this.endStamina });
      context.ctx.tokenCounter = _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.tokenCounter", { tokens: this.currentTokens, value: this.recoveryValue });
      
      if (this?.actorTarget.isOwner) {
        context.ctx.buttons.push(
          ds.utils.constructHTMLButton({
            label: _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.Buttons.yes"),
            icon: "fa-solid fa-heart-pulse",
            dataset: {
              action: "recoverStamina",
            },
          }),
        );
        context.ctx.buttons.push(
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
   * @param {PointerEvent} event    The Originating Click Event.
   */
  static async #recoverStamina(event) {
    console.log(this.actorTarget);
    await this.actorTarget.system.spendStaminaHeroToken();
  }
  /**
   * Accept the Hero's death, presenting a message.
   * @param {PointerEvent} event    The originating click event. 
   */
  static async #acceptDeath(event) {
    await ContentPart.create({ type: "content", flavor: _loc("DRAW_STEEL.ChatMessage.PARTS.cheatDeath.Buttons.no", { hero: this.actorTarget.name }) }, { parent: this.message });
  }
}
