import BasePowerRollEffect from "./base-power-roll-effect.mjs";

const {
  NumberField, SetField, StringField,
} = foundry.data.fields;

export default class DamagePowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      damage: this.duplicateTierSchema(() => ({
        value: new NumberField({ nullable: true, initial: 3, integer: true, min: 1 }),
        types: new SetField(new StringField()),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get TYPE() {
    return "damage";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      this.damage[`tier${n}`].value ??= this.#defaultDamageValue(n);
    }

    this.text ||= "{{damage}}";
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to derive default damage value used for both derived data
   * and for placeholders when rendering.
   * @param {1|2|3} n     The tier.
   * @returns {number}    The default value.
   */
  #defaultDamageValue(n) {
    switch (n) {
      case 1:
        return 1;
      case 2:
        return 2 * this.damage.tier1.value;
      case 3:
        return 3 * this.damage.tier1.value;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context) {
    context.fields.text.placeholder = "{{damage}}";
    for (const n of [1, 2, 3]) {
      const path = `damage.tier${n}`;
      context.fields[`tier${n}`].damage = {
        value: {
          field: this.schema.getField(`${path}.value`),
          value: this.damage[`tier${n}`].value,
          src: this._source.damage[`tier${n}`].value,
          name: `${path}.value`,
          placeholder: this.#defaultDamageValue(n),
        },
        types: {
          field: this.schema.getField(`${path}.types`),
          value: this.damage[`tier${n}`].types,
          src: this._source.damage[`tier${n}`].types,
          name: `${path}.types`,
        },
      };
    }
    context.fields.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
  }
}
