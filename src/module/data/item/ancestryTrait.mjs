import FeatureModel from "./feature.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * Signature and purchased features for ancestries.
 */
export default class AncestryTraitModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "ancestryTrait",
      invalidActorTypes: ["npc"],
      packOnly: true,
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

    // Null means signature trait
    schema.points = new foundry.data.fields.NumberField({ required: true, integer: true });

    return schema;
  }
}
