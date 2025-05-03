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

    this.damage.tier1.value ??= 1;
    this.damage.tier2.value ??= 2 * this.damage.tier1.value;
    this.damage.tier3.value ??= 3 * this.damage.tier1.value;

    this.text ||= "{{damage}}";
  }
}
