import { systemPath } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Classes provide the bulk of a hero's features and abilities
 */
export default class ClassModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "class",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/class.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
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

    schema.skills = new fields.SchemaField({
      options: new fields.SetField(new fields.StringField({blank: false, required: true})),
      count: new fields.NumberField(),
      choices: new fields.SetField(new fields.StringField({blank: false, required: true}))
    });

    // TODO: Copy 5e? Huge risk of changes here
    schema.advancement = new fields.ObjectField();

    return schema;
  }
}
