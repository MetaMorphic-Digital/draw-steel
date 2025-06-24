import BaseItemModel from "./base.mjs";

export default class AdvancementModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "",
      embedded: {
        // Advancement: "system.advancements",
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema({
      // TODO: Add the appropriate embedded data models in 0.8
      // advancements: new ds.data.fields.CollectionField(),
    });

    return schema;
  }

}
