import {systemPath} from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Kits provide equipment and a fighting style that grants a signature ability and bonuses to one or more game statistics
 */
export default class KitModel extends BaseItemModel {
  static metadata = Object.freeze({
    ...super.metadata,
    type: "kit",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/kit.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Kit"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG;

    // schema.type = new fields.StringField({choices: config.kits.type, initial: "martial"});

    schema.equipment = new fields.SchemaField({
      armor: new fields.StringField({required: true, blank: true}),
      weapon: new fields.SetField(new fields.StringField({required: true, blank: true})),
      shield: new fields.BooleanField()
      // implement: new fields.StringField({choices: config.equipment.implement})
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
        distance: new fields.NumberField({integer: true})
      }),
      ranged: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        distance: new fields.NumberField({integer: true})
      }),
      disengage: new fields.NumberField({integer: true})
      // magic: new fields.SchemaField({
      //   damage: new fields.SchemaField(damageSchema()),
      //   distance: new fields.NumberField({integer: true}),
      //   area: new fields.NumberField({integer: true})
      // })
    });

    // schema.signature = new fields.SchemaField({
    //   grant: new fields.DocumentUUIDField(),
    //   link: new fields.DocumentUUIDField()
    // });

    // TODO: Mobility and Wards

    return schema;
  }


  getSheetContext(context) {
    context.weaponOptions = Object.entries(ds.CONFIG.equipment.weapon).map(([value, {label}]) => ({ value, label }))
    context.armorOptions = Object.entries(ds.CONFIG.equipment.armor).map(([value, {label}]) => ({ value, label }))
  }
}
