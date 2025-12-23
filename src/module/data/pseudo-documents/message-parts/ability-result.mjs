import { systemPath } from "../../../constants.mjs";
import DrawSteelActiveEffect from "../../../documents/active-effect.mjs";
import RollPart from "./roll.mjs";
import DamageRoll from "../../../rolls/damage.mjs";

/**
 * @import { ActiveEffectData } from "@common/documents/_types.mjs";
 * @import DrawSteelItem from "../../../documents/item.mjs";
 * @import AbilityData from "../../item/ability.mjs";
 * @import AppliedPowerRollEffect from "../power-roll-effects/applied-effect.mjs";
 */

const { DocumentUUIDField, NumberField } = foundry.data.fields;

/**
 * A part that displays the result of an ability power roll and its consequences.
 */
export default class AbilityUsePart extends RollPart {
  /** @inheritdoc */
  static get TYPE() {
    return "abilityResult";
  }

  /* -------------------------------------------------- */

  static ACTIONS = {
    ...super.ACTIONS,
    applyEffect: this.#applyEffect,
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
      const htmlPRE = [];
      for (const pre of item.system.power.effects) {
        const newButtons = await pre.constructButtons(this.tier);
        if (newButtons) context.ctx.buttons.push(...newButtons);

        htmlPRE.push(pre.toText(this.tier));
      }

      context.ctx.foundItem = true;
      context.ctx.tierSymbol = ["!", "@", "#"][this.tier - 1];
      context.ctx.resultHTML = htmlPRE.filter(_ => _).join("; ");
    }
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to the selected actor.
   *
   * @this AbilityUsePart
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #applyEffect(event, target) {
    /** @type {AppliedPowerRollEffect} */
    const pre = await fromUuid(target.dataset.uuid);
    if (!pre) return void ui.notifications.error("DRAW_STEEL.ChatMessage.abilityUse.NoPRE", { localize: true });
    const effectId = target.dataset.effectId;
    const config = pre.applied[this.tierKey].effects[effectId];

    const noStack = !config.properties.has("stacking");

    const isStatus = target.dataset.type === "status";

    /** @type {DrawSteelActiveEffect} */
    const tempEffect = isStatus ?
      await DrawSteelActiveEffect.fromStatusEffect(effectId) :
      pre.item.effects.get(effectId).clone({}, { keepId: noStack, addSource: true });

    /** @type {ActiveEffectData} */
    const updates = {
      transfer: true,
      // v14 is turning this into a DocumentUUID field so needs to be a real document
      origin: pre.item.uuid,
      system: {},
    };
    if (config.end) updates.system.end = { type: config.end };
    tempEffect.updateSource(updates);

    // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
    for (const actor of ds.utils.tokensToActors()) {
      // reusing the ID will block creation if it's already on the actor
      const existing = actor.effects.get(tempEffect.id);
      // deleting instead of updating because there may be variances between the old copy and new
      if (existing?.disabled) await existing.delete();
      // not awaited to allow parallel processing
      actor.createEmbeddedDocuments("ActiveEffect", [tempEffect.toObject()], { keepId: noStack });
    }
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
     * @returns {DamageRoll}
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

    await this.update({ rolls: this.rolls.concat(newRoll) });

    return newRoll;
  }
}
