import BasePowerRollEffect from "./base-power-roll-effect.mjs";

const { StringField } = foundry.data.fields;

/**
 * General fallback type for a simple text description
 */
export default class OtherPowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      // TODO: Remove manual label assignment when localization bug is fixed
      text: this.duplicateTierSchema(() => ({
        value: new StringField({ required: true, label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.text.label" }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "other";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    for (const n of [1, 2, 3]) {
      const path = `text.tier${n}`;
      context.fields[`tier${n}`].text = {
        value: {
          field: this.schema.getField(`${path}.value`),
          value: this.text[`tier${n}`].value,
          src: this._source.text[`tier${n}`].value,
          name: `${path}.value`,
        },
      };
    }
    context.fields.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
  }
  /* -------------------------------------------------- */

  /** @inheritdoc */
  toText(tier) {
    return this.text[`tier${tier}`].value;
  }
}
