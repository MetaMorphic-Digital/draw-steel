import {systemPath} from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities
 */
export default class ClassModel extends AdvancementModel {
  static metadata = Object.freeze({
    ...super.metadata,
    type: "class",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/class.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.advancement",
    "DRAW_STEEL.Item.Class"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG;

    schema.level = new fields.NumberField({
      initial: 0,
      nullable: false,
      integer: true,
      min: 0,
      max: config.hero.xp_track.length
    });

    schema.primary = new fields.StringField({required: true});
    schema.secondary = new fields.StringField();

    schema.characteristics = new fields.SchemaField({
      core: new fields.SetField(new fields.StringField({choices: ds.CONFIG.characteristics, required: true}))
    });

    schema.stamina = new fields.SchemaField({
      starting: new fields.NumberField({required: true, initial: 20}),
      level: new fields.NumberField({required: true, initial: 12})
    });

    return schema;
  }
}
