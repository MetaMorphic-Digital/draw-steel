import BaseItemModel from "./base.mjs";

export default class AdvancementModel extends BaseItemModel {
  static metadata = Object.freeze({
    ...super.metadata,
    type: "",
    hasAdvancements: true
  });

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }

}
