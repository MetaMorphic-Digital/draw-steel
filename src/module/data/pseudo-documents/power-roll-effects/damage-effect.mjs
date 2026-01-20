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
        ignoredImmunities: new SetField(setOptions(), {
          label: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.ignoredImmunities.label",
          hint: "DRAW_STEEL.POWER_ROLL_EFFECT.FIELDS.ignoredImmunities.hint",
        }),
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
  prepareBaseData() {
    super.prepareBaseData();

    Object.assign(this.damage, {
      bonuses: {
        value: 0,
        treasure: 0,
      },
    });
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

  /** @inheritdoc */
  preparePostAbilityPrepData() {
    super.preparePostAbilityPrepData();

    // Apply treasure bonuses
    const bonuses = this.damage.bonuses;
    if (bonuses.value || bonuses.treasure) {
      for (const n of [1, 2, 3]) {
        const damageTier = this.damage[`tier${n}`];
        const formulaField = this.schema.getField(`damage.tier${n}.value`);
        const change = { mode: CONST.ACTIVE_EFFECT_MODES.ADD };

        if (bonuses.value) {
          change.value = bonuses.value;
          damageTier.value = formulaField.applyChange(damageTier.value, this, change);
        }

        if (bonuses.treasure) {
          change.value = bonuses.treasure;
          damageTier.value = formulaField.applyChange(damageTier.value, this, change);
        }
      }
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
        ignoredImmunities: {
          field: this.schema.getField(`${path}.ignoredImmunities`),
          value: this.damage[`tier${n}`].ignoredImmunities,
          src: this._source.damage[`tier${n}`].ignoredImmunities,
          name: `${path}.ignoredImmunities`,
        },
      });
    }
    context.fields.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
    context.fields.immunityTypes = [
      { value: "all", label: game.i18n.localize("DRAW_STEEL.Damage.Immunities.All") },
      { rule: true },
      ...Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label })),
    ];
  }

  /* -------------------------------------------------- */

  /**
   * @param {1 | 2 | 3} tier
   * @inheritdoc
   */
  toText(tier) {
    const { value, types, potency, ignoredImmunities } = this.damage[`tier${tier}`];
    if (Number(value) === 0) return "";

    let damageTypes;
    let i18nString = "DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.formatted";
    if (types.size) {
      const formatter = game.i18n.getListFormatter({ type: "disjunction" });
      damageTypes = formatter.format(Array.from(types).map(type => ds.CONFIG.damageTypes[type].label));
    } else {
      i18nString += "Typeless";
    }

    const simplifiedFormula = this.actor ? ds.utils.simplifyRollFormula(value, this.item.getRollData()) : value;
    const formattedDamageString = Handlebars.escapeExpression(game.i18n.format(i18nString, { value: simplifiedFormula, damageTypes }));

    let result = `<span data-tooltip="${value}" data-tooltip-direction="UP">${formattedDamageString}</span>`;

    if (ignoredImmunities.size > 0) {
      const ignoredTypes = Array.from(ignoredImmunities);
      // Special case for "all" immunity
      if (ignoredImmunities.has("all")) {
        result += ` <em>(${game.i18n.localize("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.IgnoresAllImmunities")})</em>`;
      } else {
        const formatter = game.i18n.getListFormatter({ type: "conjunction" });
        const typeLabels = ignoredTypes.map(t => ds.CONFIG.damageTypes[t]?.label).filter(_ => _);
        if (typeLabels.length > 0) {
          result += ` <em>(${game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.IgnoresImmunities", { types: formatter.format(typeLabels) })})</em>`;
        }
      }
    }

    if (potency.characteristic === "none") return result;

    const potencyString = this.toPotencyHTML(tier);

    return game.i18n.format("DRAW_STEEL.POWER_ROLL_EFFECT.DAMAGE.formattedPotency", {
      damage: result,
      potency: potencyString,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(data) {
    // 0.10.0 updates
    for (const tier of ["tier1", "tier2", "tier3"]) {
      const oldKey = `damage.${tier}.properties`;
      const migrated = foundry.abstract.Document._addDataFieldMigration(data,
        oldKey, `damage.${tier}.ignoredImmunities`,
        (effect) => {
          const properties = foundry.utils.getProperty(effect, oldKey);
          return properties?.includes("ignoresImmunity") ? ["all"] : [];
        });

      // The result is only true if the new key was *not* present and old key was present
      // If we get a false result, then we (may) need to manually delete the old key
      if (migrated === false) {
        foundry.utils.deleteProperty(data, oldKey);
      }
    }

    return super.migrateData(data);
  }
}
