import BasePowerRollEffect from "./base-power-roll-effect.mjs";
import DrawSteelActiveEffect from "../../../documents/active-effect.mjs";
import { setOptions } from "../../helpers.mjs";

/**
 * @import { ActiveEffectData } from "@common/documents/_types.mjs";
 * @import { DatabaseWriteOperation } from "@common/abstract/_types.mjs";
 * @import { StatusEffectConfig } from "@client/config.mjs";
 * @import { AppliedEffectSchema } from "./_types";
 * @import { DrawSteelActor } from "../../../documents/_module.mjs";
 */

const { SchemaField, SetField, StringField, TypedObjectField } = foundry.data.fields;

/**
 * For abilities that apply an ActiveEffect.
 */
export default class AppliedPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    const config = ds.CONFIG;

    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      applied: this.duplicateTierSchema(() => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.display.hint",
        }),
        effects: new TypedObjectField(new SchemaField({
          condition: new StringField({
            required: true,
            choices: ds.CONST.potencyConditions,
            initial: "always",
            label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.effects.element.condition.label",
          }),
          end: new StringField({
            choices: config.effectEnds,
            blank: true,
            label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.effects.element.end.label",
          }),
          properties: new SetField(setOptions(), {
            label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.effects.element.properties.label",
          }),
        })),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "applied";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      /** @type {AppliedEffectSchema} */
      const tierValue = this.applied[`tier${n}`];
      tierValue.potency.value ||= this.schema.getField(["applied", `tier${n}`, "potency", "value"]).getInitialValue({});
      if (n > 1) {
        /** @type {AppliedEffectSchema} */
        const prevTier = this.applied[`tier${n - 1}`];
        if (!this.parent.power.roll.reactive && prevTier.display) tierValue.display ||= prevTier.display;
        if (prevTier.potency.characteristic) tierValue.potency.characteristic ||= prevTier.potency.characteristic;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context, options) {
    await super._tierRenderingContext(context, options);

    const effectOptions = this.item.effects.filter(e => !e.transfer)
      .map(e => ({ value: e.id, label: e.name, group: _loc("DRAW_STEEL.POWER_ROLL_EFFECT.APPLIED.CustomEffects") }));
    const statusOptions = Object.values(CONFIG.statusEffects).filter(s => (s._id && (s.hud !== false)))
      .map(s => ({ value: s.id, label: s.name, group: _loc("DRAW_STEEL.ActiveEffect.StatusConditions") }));

    for (const n of [1, 2, 3]) {
      const path = `applied.tier${n}`;

      const effectEntries = Object.entries(this._source.applied[`tier${n}`].effects).map(([key, value]) => {
        const effect = this._getEffect(key);

        const entry = {
          id: key,
          label: effect.name,
          condition: {
            value: value.condition,
            name: `${path}.effects.${key}.condition`,
          },
          end: {
            value: value.end,
            name: `${path}.effects.${key}.end`,
          },
          properties: {
            value: value.properties,
            name: `${path}.effects.${key}.properties`,
          },
          isEffect: effect.documentName === "ActiveEffect",
        };

        return entry;
      });

      const usePlaceHolder = !this.parent.power.roll.reactive && (n > 1);

      Object.assign(context.fields[`tier${n}`].applied, {
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.applied[`tier${n}`].display,
          src: this._source.applied[`tier${n}`].display,
          placeholder: usePlaceHolder ? this.applied[`tier${n - 1}`].display : "",
          name: `${path}.display`,
        },
        effects: {
          options: effectOptions.concat(statusOptions).map(o => ({ ...o, disabled: o.value in this._source.applied[`tier${n}`].effects })),
          entries: effectEntries,
          elementFields: this.schema.getField(`${path}.effects.element`).fields,
          propertyOptions: Object.entries(ds.CONFIG.PowerRollEffect.applied.properties).map(([value, { label }]) => ({ label, value })),
          name: `${path}.effects`,
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const potencyString = this.toPotencyHTML(tier);
    // Sanitize any HTML that may be in the base display string
    const escapedDisplay = Handlebars.escapeExpression(this.applied[`tier${tier}`].display);
    return escapedDisplay.replaceAll("{{potency}}", potencyString);
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {1 | 2 | 3} tier
   */
  constructButtons(tier) {
    /** @type {HTMLButtonElement[]} */
    const buttons = [];
    for (const key of Object.keys(this.applied[`tier${tier}`].effects)) {
      const effect = this._getEffect(key);
      if (!effect.id) continue;
      buttons.push(ds.utils.constructHTMLButton({
        label: effect.name,
        img: effect.img,
        classes: ["apply-effect"],
        dataset: {
          action: "applyEffect",
          effectId: effect.id,
          uuid: this.uuid,
        },
      }));
    }
    return buttons;
  }

  /* -------------------------------------------------- */

  /**
   * Apply an effect to one or more actors.
   * @param {string} tierKey    The tier of effect to apply.
   * @param {string} effectId   A status effect or AE id.
   * @param {object} [options]
   * @param {Iterable<DrawSteelActor>} [options.targets] Defaults to all selected actors.
   * @returns {Promise<DrawSteelActiveEffect[][]>} The batched operation of created effects.
   */
  async applyEffect(tierKey, effectId, options = {}) {
    if (Array.from(options.targets ?? []).some(a => !a.isOwner)) {
      throw new Error(`${game.user.name} is not an owner of all the actors`);
    }

    const config = this.applied[tierKey].effects[effectId];

    const noStack = !config.properties.has("stacking");

    const isStatus = this._getEffect(effectId).documentName !== "ActiveEffect";

    /** @type {DrawSteelActiveEffect} */
    const tempEffect = isStatus
      ? await DrawSteelActiveEffect.fromStatusEffect(effectId)
      : this.item.effects.get(effectId).clone({}, { keepId: noStack, addSource: true });

    const targetActors = options.targets ?? ds.utils.tokensToActors();

    // Need separate operations because all deletions must be done before creations to avoid id collisions
    /** @type {DatabaseWriteOperation[]} */
    const toDelete = [];
    /** @type {DatabaseWriteOperation[]} */
    const toCreate = [];

    // Only keep the initiative value if using the "alternative" (D&D style countdown) initiative.
    const keepInitiative = !game.combats.isDefaultInitiativeMode;

    // Some abilities have durations tied to the user of the ability, rather than the target.
    let combatant = config.properties.has("originDuration") ? game.combat?.getCombatantsByActor(this.document.parent)[0] ?? "" : null;

    for (const actor of targetActors) {
      combatant ??= game.combat?.getCombatantsByActor(actor)[0];

      /** @type {ActiveEffectData} */
      const updates = {
        start: DrawSteelActiveEffect.getEffectStart(),
        transfer: true,
        origin: this.item.uuid,
      };
      if (config.end) updates.duration = { expiry: ds.CONFIG.effectEnds[config.end].expiryEvent };
      if (combatant) {
        updates.start.combatant = combatant;
        if (keepInitiative) updates.start.initiative = combatant.initiative;
      }
      // can't updateSource => toObject due to `origin` field triggering a warning when it checks for relative uuid
      const createData = foundry.utils.mergeObject(tempEffect.toObject(), updates);

      // reusing the ID will block creation if it's already on the actor
      const existing = actor.effects.get(tempEffect.id);
      // deleting instead of updating because there may be variances between the old copy and new
      if (existing) toDelete.push({ action: "delete", parent: actor, documentName: "ActiveEffect", ids: [tempEffect.id] });

      toCreate.push({ action: "create", parent: actor, documentName: "ActiveEffect", data: [createData], keepId: noStack });
    }

    await foundry.documents.modifyBatch(toDelete);
    return foundry.documents.modifyBatch(toCreate);
  }

  /* -------------------------------------------------- */

  /**
   * Fetch the applicable effect by its key, or fallback to a simple object.
   * @param {string} key
   * @returns {DrawSteelActiveEffect | StatusEffectConfig | { name: string }}
   * @protected
   */
  _getEffect(key) {
    return this.item.effects.get(key) || CONFIG.statusEffects.find(s => key === s.id) || { name: key };
  }
}
