import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 */

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

    schema.story = new fields.StringField({ required: true, blank: true });

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

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const enriched = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", this.parent.type);
    embed.innerHTML = enriched;
    if (this.story) embed.insertAdjacentHTML("afterbegin", `<em>${this.story}</em>`);
    const showPrerequisites = (config.values.includes("prerequisites") || config.prerequisites);
    if (showPrerequisites) embed.insertAdjacentHTML("afterbegin",
      `<p><strong>${this.schema.getField("prerequisites").label}</strong>:
      ${this.prerequisites.value || game.i18n.localize("DRAW_STEEL.Item.NoPrerequisites")}</p>`,
    );

    return embed;
  }
}
