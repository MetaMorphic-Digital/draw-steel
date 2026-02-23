import CreatureModel from "./creature.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import SourceModel from "../models/source.mjs";

export default class RetainerModel extends CreatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "retainer",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.SOURCE",
    "DRAW_STEEL.Actor.retainer",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.retainer = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      role: new fields.StringField({ required: true }),
    });

    schema.recoveries = new fields.SchemaField({
      value: requiredInteger(),
      max: requiredInteger({ max: 0 }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.recoveries.bonus = 0;
    this.recoveries.divisor = 3;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // allows for stamina bonuses to apply first
    this.recoveries.recoveryValue = Math.floor(this.stamina.max / this.recoveries.divisor) + this.recoveries.bonus;

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the hero's stamina and reducing the number of recoveries.
   * @returns {Promise<DrawSteelActor>}
   */
  async spendRecovery() {
    if (this.recoveries.value === 0) {
      ui.notifications.error("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.NoRecoveries", {
        format: { actor: this.parent.name },
      });
      return this.parent;
    }

    ui.notifications.success("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.Success", {
      format: { actor: this.parent.name },
    });
    await this.parent.update({ "system.recoveries.value": this.recoveries.value - 1 });

    return this.parent.modifyTokenAttribute("stamina", this.recoveries.recoveryValue, true);
  }
}
