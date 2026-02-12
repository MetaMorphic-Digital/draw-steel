import { systemPath } from "../../../constants.mjs";
import RollPart from "./roll.mjs";
import DamageRoll from "../../../rolls/damage.mjs";

/**
 * @import DrawSteelItem from "../../../documents/item.mjs";
 * @import AbilityData from "../../item/ability.mjs";
 * @import { AppliedPowerRollEffect, GainResourcePowerRollEffect } from "../power-roll-effects/_module.mjs";
 */

const { DocumentUUIDField, NumberField } = foundry.data.fields;
const { createFormGroup, createSelectInput, createTextInput } = foundry.applications.fields;

/**
 * A part that displays the result of an ability power roll and its consequences.
 */
export default class AbilityResultPart extends RollPart {
  /** @inheritdoc */
  static get TYPE() {
    return "abilityResult";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static ACTIONS = {
    ...super.ACTIONS,
    applyEffect: this.#applyEffect,
    gainResource: this.#gainResource,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = systemPath("templates/sidebar/chat/parts/ability-result.hbs");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      abilityUuid: new DocumentUUIDField({ nullable: false, type: "Item" }),
      tier: new NumberField({ integer: true, min: 1, max: 3, nullable: false }),
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

  /**
   * The key of the tier.
   * @type {"tier1" | "tier2" | "tier3" | null}
   */
  get tierKey() {
    const tier = this.tier;
    if (tier) return `tier${tier}`;
    else return null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);

    const item = this.ability;

    if (item) {
      for (const pre of item.system.power.effects) {
        const newButtons = pre.constructButtons(this.tier);
        if (newButtons) context.ctx.buttons.push(...newButtons);
      }

      context.ctx.foundItem = true;
      context.ctx.tierSymbol = ds.rolls.PowerRoll.RESULT_TIERS[`tier${this.tier}`].glyph;
      context.ctx.resultHTML = await item.system.powerRollText(this.tier);
    }

    context.ctx.showContextMenu = !!this.rolls.find(roll => (roll instanceof DamageRoll) && !roll.isHeal);
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to the selected actor.
   *
   * @this AbilityResultPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #applyEffect(event, target) {
    /** @type {AppliedPowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.PARTS.abilityResult.NoPRE", { localize: true });

    await pre.applyEffect(this.tierKey, target.dataset.effectId);
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to the selected actor.
   *
   * @this AbilityResultPart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #gainResource(event, target) {
    /** @type {GainResourcePowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.PARTS.abilityResult.NoPRE", { localize: true });

    await pre.applyGain(this.tierKey);
  }

  /* -------------------------------------------------- */

  /**
   * Create a new DamageRoll based on applying modifications to a given DamageRoll.
   * After creation, the new roll is added to the message rolls.
   * @param {DamageRoll} roll The damage roll to modify.
   * @param {object} modifications The modification options to apply.
   * @param {string} [modifications.additionalTerms] Additional formula components to append to the roll.
   * @param {string} [modifications.damageType] The damage type to use for the modified roll.
   * @param {object} [evaluationOptions={}] Options passed to the DamageRoll#evaluate.
   * @returns {Promise<DamageRoll>}
   */
  async createModifiedDamageRoll(roll, { additionalTerms = "", damageType }, evaluationOptions = {}) {
    const rollData = this.ability?.getRollData() ?? this.message.getRollData();

    const newRoll = DamageRoll.fromData(roll.toJSON());

    if (additionalTerms) {
      const terms = DamageRoll.parse(additionalTerms, rollData);
      for (const term of terms) if (!term._evaluated) await term.evaluate(evaluationOptions);
      newRoll.terms = newRoll.terms.concat(new foundry.dice.terms.OperatorTerm({ operator: "+" }), terms);
      newRoll.resetFormula();
      newRoll._total = newRoll._evaluateTotal();
    }

    if (damageType !== undefined) {
      // Without this, changing the new roll damage type changes the original rolls damage type.
      newRoll.options = { ...newRoll.options };
      newRoll.options.type = damageType;
      const damageLabel = ds.CONFIG.damageTypes[damageType]?.label ?? damageType ?? "";
      const flavor = game.i18n.format("DRAW_STEEL.Item.ability.DamageFlavor", { type: damageLabel });
      newRoll.options.flavor = flavor;
    }

    const rolls = this.rolls.concat(newRoll);

    await this.update({ rolls }, { notify: true, ds: {
      dsn: { [this.id]: [rolls.length - 1] },
    } });

    return newRoll;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _addListeners(element, context) {
    super._addListeners(element, context);

    const menuItems = this._getResultPartContextOptions();
    new foundry.applications.ux.ContextMenu.implementation(element, "[data-action=resultPartContext", menuItems, { jQuery: false, fixed: true, eventName: "click" });
  }

  /* -------------------------------------------------- */

  /**
   *
   * @returns
   */
  _getResultPartContextOptions() {
    const damageRolls = this.rolls.filter(roll => (roll instanceof DamageRoll) && !roll.isHeal);
    if (!damageRolls.length) return [];

    const baseLocalizationPath = "DRAW_STEEL.ChatMessage.PARTS.abilityResult.ContextMenuOptions.DamageModification";
    return damageRolls.map(roll => {
      const damageType = ds.CONFIG.damageTypes[roll.options.type]?.label ?? roll.options.type;
      const name = game.i18n.format(`${baseLocalizationPath}.${damageType ? "WithType" : "Typeless"}`, {
        total: roll.total,
        type: damageType,
      });
      return {
        name,
        icon: "<i class=\"fa-fw fa-solid fa-gear\"></i>",
        condition: this.message.isOwner,
        callback: () => this.modifyDamageDialog(roll),
      };
    });
  }

  /* -------------------------------------------------- */

  /**
  * Prompt the dialog to modify the damage roll and then create the modified roll.
  * @param {DamageRoll} roll
  */
  async modifyDamageDialog(roll) {
    const content = document.createElement("div");

    const additionalTermGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.ChatMessage.PARTS.abilityResult.DamageModificationDialog.AdditionalTerms.label",
      hint: "DRAW_STEEL.ChatMessage.PARTS.abilityResult.DamageModificationDialog.AdditionalTerms.hint",
      input: createTextInput({ name: "additionalTerms" }),
      localize: true,
    });

    const damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([value, { label }]) => ({ value, label }));
    const damageSelect = createSelectInput({
      value: roll.options.type,
      options: damageTypes,
      name: "damageType",
      blank: "",
    });
    const damageTypeGroup = createFormGroup({
      label: "DRAW_STEEL.ChatMessage.PARTS.abilityResult.DamageModificationDialog.DamageType.label",
      hint: "DRAW_STEEL.ChatMessage.PARTS.abilityResult.DamageModificationDialog.DamageType.hint",
      input: damageSelect,
      localize: true,
    });

    content.append(additionalTermGroup, damageTypeGroup);

    const modifications = await ds.applications.api.DSDialog.input({
      content,
      classes: ["modify-damage-dialog"],
      window: {
        title: "DRAW_STEEL.ChatMessage.PARTS.abilityResult.DamageModificationDialog.Title",
        icon: "fa-fw fa-solid fa-gear",
      },
    });

    // If the dialog is closed or submitted without modifications, don't create a new roll.
    if (!modifications) return;
    if ((modifications.additionalTerms === "") && (modifications.damageType === roll.options.type)) return;

    this.createModifiedDamageRoll(roll, modifications);
  }
}
