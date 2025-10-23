import FormulaField from "../../fields/formula-field.mjs";
import { setOptions } from "../../helpers.mjs";
import BasePowerRollEffect from "./base-power-roll-effect.mjs";

const { SetField, SchemaField, StringField } = foundry.data.fields;

/**
 * For abilities that do damage.
 */
export default class DamagePowerRollEffect extends BasePowerRollEffect {
  /** @inheritdoc */
  static defineSchema() {
    // TODO: Remove manual label assignment when localization bug is fixed
    return Object.assign(super.defineSchema(), {
      damage: this.duplicateTierSchema(() => ({
        value: new FormulaField({ initial: "2 + @chr", label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.damage.label" }),
        types: new SetField(setOptions(), { label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.types.label" }),
        properties: new SetField(setOptions(), { label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.properties.label" }),
      })),
    });
  }

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
      this.damage[`tier${n}`].value ||= this.#defaultDamageValue(n);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to derive default damage value used for both derived data
   * and for placeholders when rendering.
   * @param {1|2|3} n     The tier.
   * @returns {string}    The default value.
   */
  #defaultDamageValue(n) {
    switch (n) {
      case 1:
        return "2 + @chr";
      case 2:
        return this.damage.tier1.value;
      case 3:
        return this.damage.tier1.value;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _tierRenderingContext(context, options) {
    await super._tierRenderingContext(context, options);

    for (const n of [1, 2, 3]) {
      const path = `damage.tier${n}`;
      Object.assign(context.fields[`tier${n}`].damage, {
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
        properties: {
          field: this.schema.getField(`${path}.properties`),
          value: this.damage[`tier${n}`].properties,
          src: this._source.damage[`tier${n}`].properties,
          name: `${path}.properties`,
        },
      });
    }
    context.fields.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
    context.fields.properties = Object.entries(ds.CONFIG.PowerRollEffect.damage.properties).map(([value, { label }]) => ({ value, label }));
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const { value, types, potency } = this.damage[`tier${tier}`];
    if (Number(value) === 0) return "";

    let damageTypes;
    let i18nString = "DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.formatted";
    if (types.size) {
      const formatter = game.i18n.getListFormatter({ type: "disjunction" });
      damageTypes = formatter.format(Array.from(types).map(type => ds.CONFIG.damageTypes[type].label));
    } else {
      i18nString += "Typeless";
    }
    const formattedDamageString = game.i18n.format(i18nString, { value, damageTypes });
    if (potency.characteristic === "none") return formattedDamageString;

    const potencyString = this.toPotencyText(tier);

    return game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.formattedPotency", {
      damage: formattedDamageString,
      potency: potencyString,
    });
  }
}
