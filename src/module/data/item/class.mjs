import { systemPath } from "../../constants.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities
 */
export default class ClassModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "class",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/class.hbs")],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.class");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG;

    schema.level = new fields.NumberField({
      initial: 0,
      nullable: false,
      integer: true,
      min: 0,
      max: config.hero.xp_track.length,
    });

    schema.primary = new fields.StringField({ required: true });

    schema.turnGain = new FormulaField();

    schema.minimum = new FormulaField({ initial: "0" });

    schema.characteristics = new fields.SchemaField({
      core: new fields.SetField(setOptions()),
    });

    schema.stamina = new fields.SchemaField({
      starting: requiredInteger({ initial: 20 }),
      level: requiredInteger({ initial: 12 }),
    });

    schema.recoveries = requiredInteger({ initial: 8 });

    schema.kits = new fields.NumberField({ required: true, initial: 1 });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    super.getSheetContext(context);
    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));
    context.kitOptions = Array.fromRange(3).map(number => ({ label: number, value: number }));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    if (this.actor && (this.actor.type === "character") && (game.userId === userId)) {
      this.actor.update({ "system.recoveries.value": this.recoveries });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    if (this.actor) {
      this.actor.system.recoveries.max = this.recoveries;
      this.actor.system.stamina.max = this.stamina.starting + this.level * this.stamina.level;
    }
  }
}
