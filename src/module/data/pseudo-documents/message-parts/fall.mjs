import DamageRoll from "../../../rolls/damage.mjs";
import { DrawSteelChatMessage } from "../../../documents/_module.mjs";
import RollPart from "./roll.mjs";
import { systemPath } from "../../../constants.mjs";
import ContentPart from "./content.mjs";

/** 
* @import DrawSteelToken from "../../../canvas/placeables/token.mjs";
*/
const { DocumentUUIDField, NumberField } = foundry.data.fields;
/**
* A part that displays details about a fall and executes it.
*/
export default class FallPart extends RollPart {
 
  /** @inheritdoc */
  static get TYPE() {
    return "falling";
  }
  
  /** @inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    applyDamage: this.#applyDamage,
    fall: this.#handleFall,
  };
  /* -------------------------------------------------- */
  
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      fallerUuid: new DocumentUUIDField({ nullable: false, type: "Token" }),
      fallerDistance: new NumberField(),
    });
  }

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/fall.hbs");

  /**
   * The targeted actor, or null if one is not available.
   * @type {DrawSteelActor | null}
   */
  get actorTarget() {
    return fromUuidSync(this.token.actor.uuid) ?? null;
  }
  /**
   * The token of the actor ending the turn, or null if unavailable.
   * @type {DrawSteelToken | null}
   */
  get token() {
    return fromUuidSync(this.fallerUuid) ?? null;
  }

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    context.ctx.fallWarning = _loc("DRAW_STEEL.ChatMessage.PARTS.falling.explain", { victim: this.token.name, distance: this.fallerDistance });
    
    context.ctx.buttons.push(
      ds.utils.constructHTMLButton({
        label: _loc("DRAW_STEEL.ChatMessage.PARTS.falling.takeFall", { distance: this.fallerDistance }),
        icon: "fa-solid fa-person-falling-burst",
        dataset: {
          action: "fall",
        },
      }),
    );

  }

  /**
   * Perform a token's fall.
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   */
  static async #handleFall(event) {
    if (!this.actorTarget.isOwner) return;
    const token = this.token;
    const surface = await token._findSupportingSurface();
    token.update({ elevation: surface.elevation });

    console.log(this.parent.parts.get());

    const eventText = "<br>" + _loc("DRAW_STEEL.ChatMessage.PARTS.falling.aftermath", { victim: this.token.name, distance: this.fallerDistance, damage: this.rolls[0].formula });
    const updates = { content: eventText };

    const parts = { ...this.parent.parts };
    const contentPart = new ContentPart({ type: "content" });
    parts[contentPart._id] = contentPart;
    updates.system = { parts };

    await this.message.update(updates);

  }

  /**
   * Apply damage to the targeted actor.
   *
   * @this TargetResultPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #applyDamage(event, target) {
    const idx = target.dataset.index;
    const roll = this.rolls[idx];
    await roll.applyDamage([this.actorTarget], { halfDamage: event.shiftKey });
  }

}
