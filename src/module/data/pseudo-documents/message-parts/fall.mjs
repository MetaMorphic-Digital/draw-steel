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
    if (this.token)
    {
      context.ctx.fallWarning = _loc("DRAW_STEEL.ChatMessage.PARTS.falling.explain", { victim: this.token.name, distance: this.fallerDistance });
      
      if (this?.actorTarget.isOwner) {
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

    }

  }

  /** @inheritdoc */
  _addListeners(element, context) {
    super._addListeners(element, context);

    const menuItems = this._getResultPartContextOptions();
    new foundry.applications.ux.ContextMenu.implementation(element, "[data-action=resultPartContext]", menuItems, { jQuery: false, fixed: true, eventName: "click" });
  }

  /* -------------------------------------------------- */

  /**
   * Get context menu entries for this falling part, one for each fall damage roll.
   * @returns {ContextMenuEntry[]}
   */
  _getResultPartContextOptions() {
    return this.rolls.filter(roll => roll instanceof DamageRoll).map(roll => ({
      label: _loc("DRAW_STEEL.ChatMessage.PARTS.falling.ContextMenuOptions.ModifyFall", { distance: roll.options.fallHeight ?? this.fallerDistance }),
      icon: "fa-solid fa-person-falling",
      visible: () => this.message.isOwner && !!this.actorTarget,
      onClick: () => this.modifyFallDialog(roll),
    }));
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the dialog to modify the effective height of a fall, then create the damage roll for the new height.
   * @param {DamageRoll} roll   The fall damage roll being modified.
   */
  async modifyFallDialog(roll) {
    const actor = this.actorTarget;
    const path = "DRAW_STEEL.ChatMessage.PARTS.falling.ModifyFallDialog";
    const content = document.createElement("div");

    const canUseAgility = foundry.utils.getProperty(actor, "system.combat.fall.agility") ?? true;
    const agility = canUseAgility ? Math.max(foundry.utils.getProperty(actor, "system.characteristics.agility.value") ?? 0, 0) : 0;
    let agilityHint = _loc(`${path}.Agility.hint`);
    if (!canUseAgility) agilityHint += ` ${_loc(`${path}.Agility.prevented`)}`;

    const agilityGroup = createFormGroup({
      label: `${path}.Agility.label`,
      hint: agilityHint,
      input: createNumberInput({ name: "agility", step: 1, min: 0, max: agility }),
      localize: true,
      classes: ["slim"],
    });

    const additionalTermGroup = createFormGroup({
      label: `${path}.AdditionalTerms.label`,
      hint: `${path}.AdditionalTerms.hint`,
      input: createTextInput({ name: "additionalTerms" }),
      localize: true,
    });

    content.append(agilityGroup, additionalTermGroup);

    const modifications = await ds.applications.api.DSDialog.input({
      content,
      classes: ["modify-fall-dialog"],
      window: {
        title: `${path}.Title`,
        icon: "fa-fw fa-solid fa-gear",
      },
    });

    if (!modifications?.agility && !modifications?.additionalTerms) return;

    let height = (roll.options.fallHeight ?? this.fallerDistance) - (modifications.agility ?? 0);
    if (modifications.additionalTerms) {
      const terms = await new Roll(modifications.additionalTerms, actor.getRollData()).evaluate();
      height += terms.total;
    }

    return this.createModifiedFallRoll(roll, Math.max(height, 0));
  }

  /* -------------------------------------------------- */

  /**
   * Add a damage roll for a fall of a different effective height, built on the modified roll.
   * @param {DamageRoll} roll   The fall damage roll being modified.
   * @param {number} height     The new effective height of the fall, in squares.
   * @returns {Promise<DamageRoll>}
   */
  async createModifiedFallRoll(roll, height) {
    const difference = this.actorTarget.system.constructor.fallDamage(height) - roll.total;

    const newRoll = DamageRoll.fromData(roll.toJSON());
    const terms = [
      new foundry.dice.terms.OperatorTerm({ operator: (difference < 0) ? "-" : "+" }),
      new foundry.dice.terms.NumericTerm({ number: Math.abs(difference) }),
    ];
    for (const term of terms) if (!term._evaluated) await term.evaluate();
    newRoll.terms = newRoll.terms.concat(terms);
    newRoll.resetFormula();
    newRoll._total = newRoll._evaluateTotal();
    newRoll.options = {
      ...newRoll.options,
      fallHeight: height,
      flavor: _loc("DRAW_STEEL.ChatMessage.PARTS.falling.EffectiveFall", { distance: height }),
    };

    const rolls = this.rolls.concat(newRoll);

    await this.update({ rolls }, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });

    return newRoll;
  }

  /* -------------------------------------------------- */

  /**
   * Perform a token's fall.
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   */
  static async #handleFall(event) {
    const token = this.token;
    const surface = await token._findSupportingSurface();

    await token.move({ action: "forced", elevation: surface.elevation });
    await ContentPart.create({ type: "content", flavor: _loc("DRAW_STEEL.ChatMessage.PARTS.falling.takeFall", { distance: this.fallerDistance }) }, { parent: this.message });

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
