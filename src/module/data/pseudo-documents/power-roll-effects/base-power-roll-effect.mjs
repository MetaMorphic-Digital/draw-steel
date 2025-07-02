import FormulaField from "../../fields/formula-field.mjs";
import TypedPseudoDocument from "../typed-pseudo-document.mjs";

/** @import { DataSchema } from "@common/abstract/_types.mjs" */
/** @import { DrawSteelActor, DrawSteelItem } from "../../../documents/_module.mjs"; */

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Pseudodocument used by abilities to represent the tiered results of a power roll.
 */
export default class BasePowerRollEffect extends TypedPseudoDocument {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "PowerRollEffect",
      icon: "fa-solid fa-dice-d10",
      sheetClass: ds.applications.sheets.pseudoDocuments.PowerRollEffectSheet,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }

  /* -------------------------------------------------- */

  /**
   * Utility method to duplicate fields across three tiers.
   * @param {(n: number) => DataSchema} fieldsFn   A method that returns an object of data fields.
   * @returns {foundry.data.fields.SchemaField}       A constructed schema field with three tiers.
   */
  static duplicateTierSchema(fieldsFn) {
    const potencyFormula = [null, "@potency.weak", "@potency.average", "@potency.strong"];
    const tiersSchema = {};
    for (const n of [1, 2, 3]) {
      tiersSchema[`tier${n}`] = new SchemaField({
        ...fieldsFn(n),
        potency: new SchemaField({
          value: new FormulaField({ deterministic: true, initial: potencyFormula[n], label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.value.label" }),
          characteristic: new StringField({
            required: true,
            initial: n > 1 ? "" : "none",
            blank: n > 1,
            label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.characteristic.label",
            hint: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.characteristic.hint",
          }),
        }, { label: "DRAW_STEEL.PSEUDO.POWER_ROLL_EFFECT.FIELDS.potency.label" }),
      });
    }

    return new SchemaField(tiersSchema);
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the grandparent item
   * @type {DrawSteelItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /**
   * Reference to the great-grandparent actor
   * @type {DrawSteelActor}
   */
  get actor() {
    return this.item?.actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const n of [1, 2, 3]) {
      this[`${this.constructor.TYPE}`][`tier${n}`].potency.value ||= this.schema.getField([`${this.constructor.TYPE}`, `tier${n}`, "potency", "value"]).getInitialValue({});
      this[`${this.constructor.TYPE}`][`tier${n}`].potency.characteristic ||= this.#defaultPotencyCharacteristic(n);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to derive default potency characteristic for tiers 2 and 3.
   * @param {1|2|3} n     The tier.
   * @returns {string}    The default characteristic.
   */
  #defaultPotencyCharacteristic(tier) {
    const tierValue = this[`${this.constructor.TYPE}`][`tier${tier}`];
    let potencyCharacteristic = tierValue.potency.characteristic;
    if (tier > 1) {
      const prevTier = this[`${this.constructor.TYPE}`][`tier${tier - 1}`];
      if (prevTier.potency.characteristic) potencyCharacteristic ||= prevTier.potency.characteristic;
    }

    return potencyCharacteristic;
  }

  /* -------------------------------------------------- */

  /**
   * Implement rendering context for tiers 1-3.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {Promise<void>}   A promise that resolves once the rendering context has been mutated.
   */
  async _tierRenderingContext(context) {
    for (const n of [1, 2, 3]) {
      const path = `${this.constructor.TYPE}.tier${n}`;
      context.fields[`tier${n}`][`${this.constructor.TYPE}`] = {
        potency: {
          field: this.schema.getField(`${path}.potency`),
          value: {
            field: this.schema.getField(`${path}.potency.value`),
            value: this[`${this.constructor.TYPE}`][`tier${n}`].potency.value,
            src: this._source[`${this.constructor.TYPE}`][`tier${n}`].potency.value,
            name: `${path}.potency.value`,
          },
          characteristic: {
            field: this.schema.getField(`${path}.potency.characteristic`),
            value: this[`${this.constructor.TYPE}`][`tier${n}`].potency.characteristic,
            src: this._source[`${this.constructor.TYPE}`][`tier${n}`].potency.characteristic,
            name: `${path}.potency.characteristic`,
            blank: n > 1 ? "Default" : false,
          },
        },
      };
    }

    context.fields.characteristic = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label })).concat([{
      value: "none",
      label: "None",
    }]);
  }

  /* -------------------------------------------------- */

  /**
   * A helper method for generating the potency string (i.e M < 2).
   * @param {1|2|3} n     The tier.
   * @returns {string}    The formatted potency string
   */
  toPotencyText(tier) {
    const tierValue = this[`${this.constructor.TYPE}`][`tier${tier}`];
    const potencyValue = this.actor
      ? ds.utils.evaluateFormula(tierValue.potency.value, this.item.getRollData(), { contextName: this.uuid })
      : tierValue.potency.value;
    const potencyString = game.i18n.format("DRAW_STEEL.Item.Ability.Potency.Embed", {
      characteristic: ds.CONFIG.characteristics[tierValue.potency.characteristic]?.rollKey ?? "",
      value: potencyValue,
    });
    return potencyString;
  }

  /* -------------------------------------------------- */

  /**
   * Define how an effect renders on sheets and embeds.
   * @param {1 | 2 | 3} tier   The specific tier.
   * @returns {string}
   * @abstract
   */
  toText(tier) {}

  /* -------------------------------------------------- */

  /**
   * Constructs button for an Ability Use chat message.
   * @param {1 | 2 | 3} tier    The specific tier.
   * @returns {HTMLButtonElement[] | null} An array of buttons to add to the footer of the message, or null if there are none.
   */
  constructButtons(tier) {
    return null;
  }
}
