import { systemPath } from "../../constants.mjs";
import enrichHTML from "../../utils/enrich-html.mjs";
import { setOptions } from "../helpers.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * Kits provide equipment and a fighting style that grants a signature ability and bonuses to one or more game statistics
 */
export default class KitModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "kit",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/kit.hbs")],
    });
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

  /**
   * Prompt the user for which kit to replace when the actor is already at the maximum.
   * @returns {Promise<void|false>}
   */
  async kitSwapDialog(actor) {
    const kits = actor.system.kits.concat(this.parent);
    const kitLimit = actor.system.class?.system.kits;
    if (!Number.isNumeric(kitLimit) || (kits.length < kitLimit)) return;

    // Generate the HTML for the dialog
    let radioButtons = `<strong>${game.i18n.format("DRAW_STEEL.Item.kit.Swap.Header", { kit: this.parent.name, actor: actor.name })}</strong>`;
    for (const kit of kits) {
      radioButtons += `
        <div class="form-group">
          <label for="${kit.id}">${kit.name}</label>
          <div class="form-fields">
            <input type="radio" value="${kit.id}" name="kit" id="${kit.id}" ${(kits.length === 1 ? "checked" : "")}>
          </div>
        </div>
      `;
    }

    /** @type {object | null} */
    const fd = await ds.applications.api.DSDialog.input({
      content: radioButtons,
      window: {
        icon: "fa-solid fa-arrow-right-arrow-left",
        title: "DRAW_STEEL.Item.kit.Swap.Title",
      },
      ok: {
        label: "DRAW_STEEL.Item.kit.Swap.Button",
        icon: "fa-solid fa-arrow-right-arrow-left",
      },
    });
    if (!fd?.kit || (fd.kit === this.parent.id)) return false;

    await actor.deleteEmbeddedDocuments("Item", [fd.kit]);
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
