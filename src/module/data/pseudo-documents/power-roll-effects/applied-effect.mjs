
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/**
 * @import { AppliedEffectSchema } from "./_types"
 * @import { DataField } from "@common/data/fields.mjs";
 * @import { FormGroupConfig, FormInputConfig } from "@common/data/_types.mjs"
 */

const { SchemaField, SetField, StringField, TypedObjectField } = foundry.data.fields;

/**
 * For abilities that apply an ActiveEffect
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
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.hint",
        }),
        effects: new TypedObjectField(new SchemaField({
          condition: new StringField({ choices: ds.CONST.potencyConditions, initial: "always" }),
          end: new StringField({ choices: config.effectEnds, blank: true }),
          properties: new SetField(setOptions()),
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
        if (prevTier.display) tierValue.display ||= prevTier.display;
        if (prevTier.potency.characteristic) tierValue.potency.characteristic ||= prevTier.potency.characteristic;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    await super._tierRenderingContext(context);

    for (const n of [1, 2, 3]) {
      const path = `applied.tier${n}`;
      Object.assign(context.fields[`tier${n}`].applied, {
        effectOptions: this.item.effects.filter(e => !e.transfer).map(e => ({ value: e.id, label: e.name })),
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.applied[`tier${n}`].display,
          src: this._source.applied[`tier${n}`].display,
          placeholder: n > 1 ? this.applied[`tier${n - 1}`].display : "",
          name: `${path}.display`,
        },
        effects: {
          field: this.schema.getField(`${path}.effects`),
          value: this.applied[`tier${n}`].effects,
          src: this._source.applied[`tier${n}`].effects,
          widget: this.#effectWidget.bind(this),
          name: `${path}.effects`,
        },
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   *
   * @param {DataField} field
   * @param {FormGroupConfig} groupConfig
   * @param {FormInputConfig<AppliedEffectSchema["effects"]>} inputConfig
   * @returns {HTMLFieldSetElement}
   */
  #effectWidget(field, groupConfig, inputConfig) {
    const widget = document.createElement("fieldset");
    widget.insertAdjacentHTML("afterbegin", `<legend>${game.i18n.localize("DRAW_STEEL.Effect.Applied")}</legend>`);
    console.log(field, groupConfig, inputConfig);

    // Unconventional select so creating by hand
    const effectSelect = document.createElement("select");
    effectSelect.insertAdjacentHTML("afterbegin", "<option></option>");

    effectSelect.dataset = {
      // Nontraditional select so not using normal `name` attribute
      name: inputConfig.name,
    };

    const customGroup = document.createElement("optgroup");
    customGroup.label = game.i18n.localize("DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.APPLIED.CustomEffects");
    effectSelect.insertAdjacentElement("beforeend", customGroup);
    for (const e of this.item.effects) {
      if (e.transfer) continue;
      const o = document.createElement("option");
      o.value = e.id;
      o.innerText = e.name;
      if (e.id in inputConfig.value) o.disabled = true;
      customGroup.insertAdjacentElement("beforeend", o);
    }

    const statusGroup = document.createElement("optgroup");
    statusGroup.label = game.i18n.localize("DRAW_STEEL.Effect.StatusConditions");
    effectSelect.insertAdjacentElement("beforeend", statusGroup);
    for (const s of CONFIG.statusEffects) {
      if (!s._id || (s.hud === false)) continue;
      const o = document.createElement("option");
      o.value = s._id;
      o.innerText = s.name || s.label;
      if (s._id in inputConfig.value) o.disabled = true;
      statusGroup.insertAdjacentElement("beforeend", o);
    }

    const addEffect = foundry.applications.fields.createFormGroup({
      input: effectSelect,
      label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.APPLIED.AddEffect",
      localize: true,
    });

    widget.insertAdjacentElement("afterbegin", addEffect);

    for (const [key, value] of Object.entries(inputConfig.value)) widget.insertAdjacentHTML("beforeend", `<div>${key}</div>`);
    return widget;
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const potencyString = this.toPotencyText(tier);
    return this.applied[`tier${tier}`].display.replaceAll("{{potency}}", potencyString);
  }
}
