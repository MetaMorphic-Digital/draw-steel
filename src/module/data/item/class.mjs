import { systemPath } from "../../constants.mjs";
import FormulaField from "../fields/formula-field.mjs";
import { setOptions } from "../helpers.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities
 */
export default class ClassModel extends AdvancementModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "class",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/class.hbs")],
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Class",
  ];

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

    schema.characteristics = new fields.SchemaField({
      core: new fields.SetField(setOptions()),
    });

    schema.stamina = new fields.SchemaField({
      starting: new fields.NumberField({ required: true, initial: 20 }),
      level: new fields.NumberField({ required: true, initial: 12 }),
    });

    schema.recoveries = new fields.NumberField({ required: true, nullable: false, initial: 8 });

    schema.kits = new fields.NumberField({ required: true, initial: 1 });

    // TODO: Potency

    return schema;
  }

  /** @inheritdoc */
  async getSheetContext(context) {
    context.characteristics = Object.entries(ds.CONFIG.characteristics).map(([value, { label }]) => ({ value, label }));
    context.kitOptions = Array.fromRange(3).map(number => ({ label: number, value: number }));
  }

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    if (this.actor && (this.actor.type === "character") && (game.userId === userId)) {
      this.actor.update({ "system.hero.recoveries.value": this.recoveries });
    }
  }
}
