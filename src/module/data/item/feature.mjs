import { systemPath } from "../../constants.mjs";
import { requiredInteger } from "../helpers.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Passive benefits usually granted by other items.
 */
export default class FeatureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "feature",
      packOnly: false,
      detailsPartial: [systemPath("templates/sheets/item/partials/feature.hbs")],
    };
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

    schema.points = requiredInteger({ initial: 1 });

    return schema;
  }

  /* -------------------------------------------------- */

  /**
   * Does this feature use the points information for item grant budgets.
   * @type {boolean}
   */
  get purchasable() {
    return !!ds.CONFIG.features.types[this.type.value]?.subtypes[this.type.subtype]?.purchaseable;
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
