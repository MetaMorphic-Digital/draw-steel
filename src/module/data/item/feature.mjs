import AdvancementModel from "./advancement.mjs";
import { systemPath } from "../../constants.mjs";
import { setOptions, validateDSID } from "../helpers.mjs";

/**
 * A data model directly representing class and monster features as well as the basis for ancestry traits, perks, and titles.
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

    // Can be expanded over time for automation
    schema.prerequisites = new fields.SchemaField({
      value: new fields.StringField({ required: true }),
      dsid: new fields.SetField(setOptions({
        validate: validateDSID,
        validationError: game.i18n.localize("DRAW_STEEL.SOURCE.InvalidDSID"),
      })),
      level: new fields.NumberField({ required: true, integer: true, positive: true }),
    });

    return schema;
  }
}
