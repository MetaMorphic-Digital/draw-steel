import FormulaField from "../../fields/formula-field.mjs";
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

/** @import { ForcedMovementSchema } from "./_types" */

const { BooleanField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * For abilities that inflict forced movement.
 */
export default class ForcedMovementPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    const potencyFormula = [null, "@potency.weak", "@potency.average", "@potency.strong"];

    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      forced: this.duplicateTierSchema((n) => ({
        display: new StringField({
          required: true,
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.display.hintForced",
          initial: "{{forced}}",
        }),
        movement: new SetField(
          setOptions(),
          { initial: ["push"], label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.movement.label" },
        ),
        distance: new FormulaField({ initial: "1", label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.distance.label" }),
        vertical: new BooleanField({ label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.vertical.label" }),
        potency: new SchemaField({
          value: new FormulaField({ initial: potencyFormula[n], label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.value.label" }),
          characteristic: new StringField({
            required: true,
            initial: n > 1 ? "" : "none",
            blank: n > 1,
            label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.characteristic.label",
            hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.characteristic.hint",
          }),
        }, { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.label" }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "forced";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      /** @type {ForcedMovementSchema} */
      const tierValue = this.forced[`tier${n}`];
      tierValue.potency.value ||= this.schema.getField(["forced", `tier${n}`, "potency", "value"]).initial;
      if (n > 1) {
        /** @type {ForcedMovementSchema} */
        const prevTier = this.forced[`tier${n - 1}`];
        if (prevTier.display) tierValue.display ||= prevTier.display;
        if (prevTier.potency.characteristic) tierValue.potency.characteristic ||= prevTier.potency.characteristic;
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    for (const n of [1, 2, 3]) {
      const path = `forced.tier${n}`;
      context.fields[`tier${n}`].forced = {
        display: {
          field: this.schema.getField(`${path}.display`),
          value: this.forced[`tier${n}`].display,
          src: this._source.forced[`tier${n}`].display,
          placeholder: n > 1 ? this.forced[`tier${n - 1}`].display : "",
          name: `${path}.display`,
        },
        movement: {
          field: this.schema.getField(`${path}.movement`),
          movement: this.forced[`tier${n}`].movement,
          src: this._source.forced[`tier${n}`].movement,
          name: `${path}.movement`,
          options: Object.entries(ds.CONFIG.abilities.forcedMovement).map(([value, { label }]) => ({ value, label })),
        },
        distance: {
          field: this.schema.getField(`${path}.distance`),
          distance: this.forced[`tier${n}`].distance,
          src: this._source.forced[`tier${n}`].distance,
          name: `${path}.distance`,
        },
        vertical: {
          field: this.schema.getField(`${path}.vertical`),
          vertical: this.forced[`tier${n}`].vertical,
          src: this._source.forced[`tier${n}`].vertical,
          name: `${path}.vertical`,
        },
        potency: {
          field: this.schema.getField(`${path}.potency`),
          value: {
            field: this.schema.getField(`${path}.potency.value`),
            value: this.forced[`tier${n}`].potency.value,
            src: this._source.forced[`tier${n}`].potency.value,
            name: `${path}.potency.value`,
          },
          characteristic: {
            field: this.schema.getField(`${path}.potency.characteristic`),
            value: this.forced[`tier${n}`].potency.characteristic,
            src: this._source.forced[`tier${n}`].potency.characteristic,
            name: `${path}.potency.characteristic`,
            options: Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label })).concat([{
              value: "none",
              label: "None",
            }]),
            blank: n > 1 ? "Default" : false,
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
    const tierValue = this.forced[`tier${tier}`];
    let potencyValue = tierValue.potency.value;
    let distanceValue = tierValue.distance;
    if (this.actor) {
      potencyValue = new DSRoll(potencyValue, this.item.getRollData()).evaluateSync({ strict: false }).total;
      distanceValue = new DSRoll(distanceValue, this.item.getRollData()).evaluateSync({ strict: false }).total;
    }
    const potencyString = game.i18n.format("DRAW_STEEL.Item.Ability.Potency.Embed", {
      characteristic: ds.CONFIG.characteristics[tierValue.potency.characteristic]?.rollKey ?? "",
      value: potencyValue,
    });
    const formatter = game.i18n.getListFormatter({ type: "disjunction" });
    const distanceString = game.i18n.format("DRAW_STEEL.Item.Ability.ForcedMovement.Display", {
      movement: formatter.format(tierValue.movement.map(v => {
        const config = ds.CONFIG.abilities.forcedMovement[v];
        return tierValue.vertical ? config.vertical : config.label;
      })),
      distance: distanceValue,
    });
    let finalText = this.forced[`tier${tier}`].display.replaceAll("{{potency}}", potencyString);
    return finalText.replaceAll("{{forced}}", distanceString);
  }
}
