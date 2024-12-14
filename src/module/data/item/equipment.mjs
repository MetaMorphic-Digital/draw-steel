import {systemPath} from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Equipment covers all physical items that provide special benefits beyond the base kit
 */
export default class EquipmentModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "equipment",
    detailsPartial: [systemPath("templates/item/partials/equipment.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Equipment"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG.equipment;

    schema.kind = new fields.StringField({required: true, choices: config.kind, blank: true});
    schema.category = new fields.StringField({required: true});

    return schema;
  }
}
