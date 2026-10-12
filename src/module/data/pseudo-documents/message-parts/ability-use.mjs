import BaseMessagePart from "./base-message-part.mjs";
import { setOptions } from "../../helpers.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import DrawSteelItem from "../../../documents/item.mjs";
 * @import AbilityData from "../../item/ability.mjs";
 */

const { DocumentUUIDField, NumberField, SetField, TypedObjectField } = foundry.data.fields;

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
    persistent: this.#applyPersist,
    placeTemplate: this.#placeTemplate,
    performSummon: this.#performSummon,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/ability-use.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilityUuid: new DocumentUUIDField({ nullable: false, type: "Item" }),
      effects: new SetField(setOptions({ validate: foundry.data.validators.isValidId })),
      spendAmounts: new TypedObjectField(new NumberField()),
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
  get visible() {
    return this.isContentVisible;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const item = this.ability;

    if (!item) {
      context.ctx.embed = document.createElement("p");
      context.ctx.embed.innerText = _loc("DRAW_STEEL.Item.ability.EmbedFail");
      return;
    }

    const embedConfig = {
      tier1: false,
      tier2: false,
      tier3: false,
      effects: this.effects,
      spendAmounts: this.spendAmounts,
    };

    context.ctx.embed = await item.toEmbed(embedConfig);

    if (item.isOwner && item.system.hasTemplate) {
      context.ctx.buttons.push(ds.utils.constructHTMLButton({
        label: _loc("DRAW_STEEL.Item.ability.placeTemplate"),
        icon: "fa-solid fa-ruler-combined",
        dataset: {
          action: "placeTemplate",
        },
      }));
    }

    if (item.system.power.roll.reactive) {
      for (const chr of item.system.power.roll.characteristics) {
        const characteristic = ds.CONFIG.characteristics[chr]?.label ?? "";

        context.ctx.buttons.push(ds.utils.constructHTMLButton({
          label: _loc("DRAW_STEEL.ChatMessage.PARTS.abilityUse.performTest", { characteristic }),
          icon: "fa-solid fa-dice-d10",
          dataset: {
            chr,
            action: "rollTest",
          },
        }));
      }
    }

    for (const effectId of this.effects) {
      const specialEffect = item.system.effects.get(effectId);
      const buttons = specialEffect.constructButtons();
      if (buttons) context.ctx.buttons.push(...buttons);
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

  /* -------------------------------------------------- */

  /**
   * Place the template for this ability.
   *
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #placeTemplate(event, target) {
    await this.ability.system.placeTemplate();
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to track the persistent cost to the user of this ability.
   *
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #applyPersist(event, target) {
    const item = this.ability;
    if (!item) return void console.error("Source item no longer exists!");
    const { specialEffectId } = target.dataset;
    const specialEffect = item.system.effects.get(specialEffectId);
    await specialEffect.applyPersist();
  }

  /* -------------------------------------------------- */

  /**
   * Perform a given effect's summoning.
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #performSummon(event, target) {
    const item = this.ability;
    if (!item) return void console.error("Source item no longer exists!");
    const { specialEffectId } = target.dataset;
    const specialEffect = item.system.effects.get(specialEffectId);
    await specialEffect.performSummon();
  }
}
