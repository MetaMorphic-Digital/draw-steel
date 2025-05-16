import { DSRoll } from "../../../rolls/base.mjs";
import FormulaField from "../../fields/formula-field.mjs";
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/** @import { AppliedEffectSchema } from "./_types" */

const { SetField, StringField, SchemaField } = foundry.data.fields;

/**
 * For abilities that apply an ActiveEffect
 */
export default class AppliedPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    const potencyFormula = [null, "@potency.weak", "@potency.average", "@potency.strong"];

    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      applied: this.duplicateTierSchema(() => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.hint",
        }),
        always: new SetField(
          setOptions({ validate: foundry.data.validators.isValidId }),
          { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.always.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.always.hint" },
        ),
        failure: new SetField(
          setOptions({ validate: foundry.data.validators.isValidId }),
          { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.failure.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.failure.hint" },
        ),
        success: new SetField(
          setOptions({ validate: foundry.data.validators.isValidId }),
          { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.success.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.success.hint" },
        ),
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
      tierValue.potency.value ||= this.schema.getField(["applied", `tier${n}`, "potency", "value"]).initial;
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
        always: {
          field: this.schema.getField(`${path}.always`),
          value: this.applied[`tier${n}`].always,
          src: this._source.applied[`tier${n}`].always,
          name: `${path}.always`,
        },
        success: {
          field: this.schema.getField(`${path}.success`),
          value: this.applied[`tier${n}`].success,
          src: this._source.applied[`tier${n}`].success,
          name: `${path}.success`,
        },
        failure: {
          field: this.schema.getField(`${path}.failure`),
          value: this.applied[`tier${n}`].failure,
          src: this._source.applied[`tier${n}`].failure,
          name: `${path}.failure`,
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
    const potencyString = this.toPotencyText(tier);
    return this.applied[`tier${tier}`].display.replaceAll("{{potency}}", potencyString);
  }
}
