import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Passive benefits usually granted by other items
 */
export default class FeatureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "feature",
      detailsPartial: [systemPath("templates/sheets/item/partials/feature.hbs")],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.feature");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.type = new fields.SchemaField({
      value: new fields.StringField({ required: true }),
      subtype: new fields.StringField({ required: true }),
    });

    // Can be expanded over time for automation
    schema.prerequisites = new fields.SchemaField({
      value: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const featureConfig = ds.CONFIG.features;

    context.featureTypes = Object.entries(featureConfig.types).map(([value, entry]) => ({ value, label: entry.label }));

    if (featureConfig.types[this.type.value]?.subtypes) {
      context.featureSubtypes = Object.entries(featureConfig.types[this.type.value].subtypes).map(([value, { label }]) => ({ value, label }));
    }
  }
}
