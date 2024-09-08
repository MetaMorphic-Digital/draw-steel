import BaseItemModel from "./base.mjs";

/**
 * Kits provide equipment and a fighting style that grants a signature ability and bonuses to one or more game statistics
 */
export default class KitModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "kit",
    invalidActorTypes: ["npc"]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Kit"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG;

    schema.type = new fields.StringField({choices: config.kits.type, initial: "martial"});

    schema.equipment = new fields.SchemaField({
      armor: new fields.StringField({choices: config.equipment.armor}),
      weapon: new fields.StringField({choices: config.equipment.weapon}),
      implement: new fields.StringField({choices: config.equipment.implement})
    });

    const damageSchema = () => ({
      tier1: new fields.NumberField({initial: 0, integer: true}),
      tier2: new fields.NumberField({initial: 0, integer: true}),
      tier3: new fields.NumberField({initial: 0, integer: true})
    });

    schema.bonuses = new fields.SchemaField({
      stamina: new fields.NumberField({integer: true}),
      speed: new fields.NumberField({integer: true}),
      stability: new fields.NumberField({integer: true}),
      melee: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        reach: new fields.NumberField({integer: true})
      }),
      ranged: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        distance: new fields.NumberField({integer: true})
      }),
      magic: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        distance: new fields.NumberField({integer: true}),
        area: new fields.NumberField({integer: true})
      })
    });

    // schema.signature = new fields.SchemaField({
    //   grant: new fields.DocumentUUIDField(),
    //   link: new fields.DocumentUUIDField()
    // });

    // TODO: Mobility and Wards

    return schema;
  }
}
