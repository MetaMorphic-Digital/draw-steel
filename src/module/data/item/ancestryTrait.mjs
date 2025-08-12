import FeatureModel from "./feature.mjs";

/**
 * Signature and purchased features for ancestries.
 */
export default class AncestryTraitModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "ancestryTrait",
      detailsPartial: [systemPath("templates/sheets/item/partials/ancestryTrait.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.ancestryTrait");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.points = new foundry.data.fields.NumberField({ integer: true });

    return schema;
  }
}
