import {systemPath} from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Passive benefits usually granted by other items
 */
export default class FeatureModel extends BaseItemModel {
  /** @override */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "feature",
    detailsPartial: [systemPath("templates/item/partials/feature.hbs")]
  });

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Feature"
  ];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.type = new fields.SchemaField({
      value: new fields.StringField({required: true}),
      subtype: new fields.StringField({required: true})
    });

    // Can be expanded over time for automation
    schema.prerequisites = new fields.SchemaField({
      value: new fields.StringField({required: true})
    });

    return schema;
  }

  /** @override */
  getSheetContext(context) {
    const featureConfig = ds.CONFIG.features;

    context.featureTypes = Object.entries(featureConfig.types).map(([value, entry]) => ({value, label: entry.label}));

    if (featureConfig.types[this.type.value]?.subtypes) {
      context.featureSubtypes = Object.entries(featureConfig.types[this.type.value].subtypes).map(([value, label]) => ({value, label}));
    }
  }
}
