import { systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { setOptions } from "../helpers.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * @import { DocumentHTMLEmbedConfig, EnrichmentOptions } from "@client/applications/ux/text-editor.mjs";
 */

/**
 * Kits provide equipment and a fighting style that grants a signature ability and bonuses to one or more game statistics.
 */
export default class KitModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "kit",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/kit.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.kit");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.equipment = new fields.SchemaField({
      armor: new fields.StringField({ required: true, blank: true }),
      weapon: new fields.SetField(setOptions()),
      shield: new fields.BooleanField(),
    });

    const damageSchema = () => ({
      tier1: new fields.NumberField({ initial: 0, integer: true }),
      tier2: new fields.NumberField({ initial: 0, integer: true }),
      tier3: new fields.NumberField({ initial: 0, integer: true }),
    });

    schema.bonuses = new fields.SchemaField({
      stamina: new fields.NumberField({ integer: true }),
      speed: new fields.NumberField({ integer: true }),
      stability: new fields.NumberField({ integer: true }),
      melee: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        distance: new fields.NumberField({ integer: true }),
      }),
      ranged: new fields.SchemaField({
        damage: new fields.SchemaField(damageSchema()),
        distance: new fields.NumberField({ integer: true }),
      }),
      disengage: new fields.NumberField({ integer: true }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    if (!this.advancements.size) {
      const signature = {
        type: "itemGrant",
        chooseN: 1,
        name: game.i18n.localize("DRAW_STEEL.Item.kit.SignatureAbilityAdvancement.name"),
        description: `<p>${game.i18n.localize("DRAW_STEEL.Item.kit.SignatureAbilityAdvancement.description")}</p>`,
        requirements: {
          level: null,
        },
        _id: "signature".padEnd(16, "0"),
      };
      this.parent.updateSource({ [`system.advancements.${signature._id}`]: signature });
    }
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const embed = document.createElement("div");
    embed.classList.add("draw-steel", "kit");
    if (config.includeName !== false) embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
      showDescription: true, // used to prevent showing the description on the details tab of the kit sheet
    };
    context.enrichedDescription = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });
    await this.getSheetContext(context);
    //TODO: Once kits provide a signature item, add the ability embed or link to the item
    const kitBody = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/item/kit.hbs"), context);
    embed.insertAdjacentHTML("beforeend", kitBody);
    return embed;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(context) {
    context.weaponOptions = Object.entries(ds.CONFIG.equipment.weapon).map(([value, { label }]) => ({ value, label }));
    context.armorOptions = Object.entries(ds.CONFIG.equipment.armor).map(([value, { label }]) => ({ value, label }))
      .filter(entry => ds.CONFIG.equipment.armor[entry.value].kitEquipment);

    context.armorLabel = ds.CONFIG.equipment.armor[this.equipment.armor]?.label ?? "";

    const weaponFormatter = game.i18n.getListFormatter({ type: "unit" });
    const weaponList = Array.from(this.equipment.weapon).map(w => ds.CONFIG.equipment.weapon[w]?.label ?? w);
    context.weaponLabel = weaponFormatter.format(weaponList);
  }
}
