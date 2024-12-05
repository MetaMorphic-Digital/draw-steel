import { systemPath } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Passive benefits usually granted by other items
 */
export default class FeatureModel extends BaseItemModel {
  static metadata = Object.freeze({
    type: "feature",
    detailsPartial: [systemPath("templates/item/partials/feature.hbs")]
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Feature"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    return schema;
  }
}
