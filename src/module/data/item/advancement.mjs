import BaseItemModel from "./base.mjs";

export default class AdvancementModel extends BaseItemModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "",
    hasAdvancements: true
  });

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }

}
