import { DSRoll } from "../../../rolls/base.mjs";
import FormulaField from "../../fields/formula-field.mjs";
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

const { BooleanField, SetField, StringField, SchemaField } = foundry.data.fields;

/**
 * For abilities that apply an ActiveEffect
 */
export default class AppliedPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    const potencyFormula = [null, "@potency.weak", "@potency.average", "@potency.strong"];

    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      applied: this.duplicateTierSchema((n) => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.hint",
        }),
        always: new SetField(
          setOptions({ validate: foundry.data.validators.isValidId }),
          { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.always.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.always.hint" },
        ),
        potency: new SchemaField({
          value: new FormulaField({ initial: potencyFormula[n], label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.value.label" }),
          characteristic: new StringField({ required: true, label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.characteristic.label" }),
          success: new SetField(
            setOptions({ validate: foundry.data.validators.isValidId }),
            { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.success.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.success.hint" },
          ),
          failure: new SetField(setOptions(
            { validate: foundry.data.validators.isValidId }),
          { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.failure.label", hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.failure.hint" },
          ),
        }, { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.label" }),
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
      const tierValue = this.applied[`tier${n}`];
      tierValue.potency.value ||= this.schema.getField(["applied", `tier${n}`, "potency", "value"]).initial;
      const prevDisplay = (n > 1) && foundry.utils.getProperty(this, `applied.tier${n - 1}.display`);
      if (prevDisplay) tierValue.display ||= prevDisplay;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    for (const n of [1, 2, 3]) {
      const path = `applied.tier${n}`;
      context.fields[`tier${n}`].applied = {
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
        potency: {
          field: this.schema.getField(`${path}.potency`),
          value: {
            field: this.schema.getField(`${path}.potency.value`),
            value: this.applied[`tier${n}`].potency.value,
            src: this._source.applied[`tier${n}`].potency.value,
            name: `${path}.potency.value`,
          },
          characteristic: {
            field: this.schema.getField(`${path}.potency.characteristic`),
            value: this.applied[`tier${n}`].potency.characteristic,
            src: this._source.applied[`tier${n}`].potency.characteristic,
            name: `${path}.potency.characteristic`,
            options: Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label })),
          },
          success: {
            field: this.schema.getField(`${path}.potency.success`),
            value: this.applied[`tier${n}`].potency.success,
            src: this._source.applied[`tier${n}`].potency.success,
            name: `${path}.potency.success`,
          },
          failure: {
            field: this.schema.getField(`${path}.potency.failure`),
            value: this.applied[`tier${n}`].potency.failure,
            src: this._source.applied[`tier${n}`].potency.failure,
            name: `${path}.potency.failure`,
          },
        },
      };
    }
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const tierValue = this.applied[`tier${tier}`];
    let potencyValue = tierValue.potency.value;
    if (this.actor) {
      potencyValue = new DSRoll(potencyValue, this.actor.getRollData()).evaluateSync({ strict: false }).total;
    }
    const potencyString = game.i18n.format("DRAW_STEEL.Item.Ability.Potency.Embed", {
      characteristic: ds.CONFIG.characteristics[tierValue.potency.characteristic]?.rollKey ?? "",
      value: potencyValue,
    });
    return this.applied[`tier${tier}`].display.replaceAll("{{potency}}", potencyString);
  }
}
