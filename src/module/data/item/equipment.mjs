import BaseItemModel from "./base.mjs";

export default class EquipmentModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "equipment"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Equipment"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = {required: true, nullable: false, integer: true};
    const schema = super.defineSchema();

    schema.quantity = new fields.NumberField({
      ...requiredInteger,
      initial: 1,
      min: 1
    });
    schema.weight = new fields.NumberField({
      required: true,
      nullable: false,
      initial: 0,
      min: 0
    });

    return schema;
  }

  prepareDerivedData() {
  }
}
