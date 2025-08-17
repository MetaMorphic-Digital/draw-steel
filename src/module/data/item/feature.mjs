import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * A data model directly representing class and monster features as well as the basis for ancestry traits, perks, and titles.
 */
export default class FeatureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "feature",
      // Not currently in use
      // detailsPartial: [systemPath("templates/sheets/item/partials/feature.hbs")],
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

    // TODO: https://github.com/MetaMorphic-Digital/draw-steel/issues/839 will re-add content here.

    return schema;
  }
}
