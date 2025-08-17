import FeatureModel from "./feature.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * A feature available to all heroes that helps with exploration, investigation, negotiation, and more.
 */
export default class PerkModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "perk",
      detailsPartial: [systemPath("templates/sheets/item/partials/perk.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.perk");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.perkType = new fields.StringField({ required: true, blank: false, initial: "crafting" });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    const perkConfig = ds.CONFIG.perks;

    // Perk types also include the skill groups
    const skillGroups = Object.entries(ds.CONFIG.skills.groups).map(([value, entry]) => ({ value, label: entry.label }));

    context.perkTypes = skillGroups.concat(Object.entries(perkConfig.types).map(([value, entry]) => ({ value, label: entry.label })));
  }
}
