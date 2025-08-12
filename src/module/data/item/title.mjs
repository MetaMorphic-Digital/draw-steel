import FeatureModel from "./feature.mjs";
import { systemPath } from "../../constants.mjs";
import { requiredInteger } from "../helpers.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 */

/**
 * A special reward that a hero can earn while adventuring, and which grants benefits or new abilities.
 */
export default class TitleModel extends FeatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "title",
      packOnly: false,
      detailsPartial: [systemPath("templates/sheets/item/partials/title.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.title");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.echelon = requiredInteger({ initial: 1 });

    schema.story = new fields.StringField({ required: true, blank: true });

    // Can be expanded over time for automation
    schema.prerequisites = new fields.SchemaField({
      value: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    context.echelons = Object.entries(ds.CONFIG.echelons).map(([value, entry]) => ({ value, label: entry.label }));
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
    const showPrerequisites = (config.values?.includes("prerequisites") || config.prerequisites);
    if (showPrerequisites) embed.insertAdjacentHTML("afterbegin",
      `<p><strong>${this.schema.getField("prerequisites").label}</strong>:
      ${this.prerequisites.value || game.i18n.localize("DRAW_STEEL.Item.NoPrerequisites")}</p>`,
    );

    return embed;
  }
}
