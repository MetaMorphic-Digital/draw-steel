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
      other: this.duplicateTierSchema(() => ({
        text: new StringField({
          required: true,
          label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.text.label",
          hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.text.hint",
        }),
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
    await super._tierRenderingContext(context);

    for (const n of [1, 2, 3]) {
      const path = `other.tier${n}`;
      context.fields[`tier${n}`].other = foundry.utils.mergeObject(context.fields[`tier${n}`].other, {
        text: {
          field: this.schema.getField(`${path}.text`),
          value: this.other[`tier${n}`].text,
          src: this._source.other[`tier${n}`].text,
          name: `${path}.text`,
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
    return this.other[`tier${tier}`].text.replaceAll("{{potency}}", potencyString);
  }
}
