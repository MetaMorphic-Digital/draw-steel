import { systemPath } from "../../constants.mjs";
import { setOptions } from "../helpers.mjs";
import BaseItemModel from "./base.mjs";

/**
 * Kits provide equipment and a fighting style that grants a signature ability and bonuses to one or more game statistics
 */
export default class KitModel extends BaseItemModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    ...super.metadata,
    type: "kit",
    invalidActorTypes: ["npc"],
    detailsPartial: [systemPath("templates/item/partials/kit.hbs")],
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.Item.Kit",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    const config = ds.CONFIG;

    // schema.type = new fields.StringField({choices: config.kits.type, initial: "martial"});

    schema.equipment = new fields.SchemaField({
      armor: new fields.StringField({ required: true, blank: true }),
      weapon: new fields.SetField(setOptions()),
      shield: new fields.BooleanField(),
      // implement: new fields.StringField({choices: config.equipment.implement})
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

    // schema.signature = new fields.SchemaField({
    //   grant: new fields.DocumentUUIDField(),
    //   link: new fields.DocumentUUIDField()
    // });

    return schema;
  }

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const actor = this.parent.actor;
    if (actor) {
      const actorClass = actor.system.class;
      if (actorClass?.system.kits === 0) {
        const message = game.i18n.format("DRAW_STEEL.Item.Kit.NotAllowedByClass", { class: actorClass.name });
        ui.notifications.error(message);
        return false;
      }

      const swapKit = await this._kitSwapDialog();
      if (swapKit === false) return false;
    }
  }

  /**
   * @inheritdoc
   * @param {DocumentHTMLEmbedConfig} config
   * @param {EnrichmentOptions} options
   */
  async toEmbed(config, options = {}) {
    const embed = document.createElement("div");
    embed.classList.add("kit");
    embed.insertAdjacentHTML("afterbegin", `<h5>${this.parent.name}</h5>`);
    const context = {
      system: this,
      systemFields: this.schema.fields,
      config: ds.CONFIG,
      showDescription: true, // used to prevent showing the description on the details tab of the kit sheet
    };
    context.enrichedDescription = await TextEditor.enrichHTML(
      this.description.value,
      {
        secrets: this.parent.isOwner,
        rollData: this.parent.getRollData(),
        relativeTo: this.parent,
      },
    );
    this.getSheetContext(context);
    //TODO: Once kits provide a signature item, add the ability embed or link to the item
    const kitBody = await renderTemplate(systemPath("templates/item/embeds/kit.hbs"), context);
    embed.insertAdjacentHTML("beforeend", kitBody);
    return embed;
  }

  /**
   * Prompt the user for which kit to replace when the actor is already at the maximum.
   * @returns {Promise<void|false>}
   */
  async _kitSwapDialog() {
    const actor = this.parent.actor;
    const kits = actor.system.kits;
    const kitLimit = actor.system.class?.system.kits;
    if (!Number.isNumeric(kitLimit) || (kits.length < kitLimit)) return;

    // Generate the HTML for the dialog
    let radioButtons = `<strong>${game.i18n.format("DRAW_STEEL.Item.Kit.Swap.Header", { kit: this.parent.name, actor: this.parent.actor.name })}</strong>`;
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

    /** @type {FormDataExtended | null} */
    const fd = await foundry.applications.api.DialogV2.prompt({
      content: radioButtons,
      window: {
        icon: "fa-solid fa-arrow-right-arrow-left",
        title: "DRAW_STEEL.Item.Kit.Swap.Title",
      },
      position: {
        width: 400,
      },
      ok: {
        label: "DRAW_STEEL.Item.Kit.Swap.Button",
        icon: "fa-solid fa-arrow-right-arrow-left",
        callback: (event, button, dialog) => {
          return new FormDataExtended(button.form);
        },
      },
      rejectClose: false,
    });
    if (!fd?.object.kit) return false;

    await actor.deleteEmbeddedDocuments("Item", [fd.object.kit]);
  }

  /** @inheritdoc */
  getSheetContext(context) {
    context.weaponOptions = Object.entries(ds.CONFIG.equipment.weapon).map(([value, { label }]) => ({ value, label }));
    context.armorOptions = Object.entries(ds.CONFIG.equipment.armor).map(([value, { label }]) => ({ value, label }))
      .filter(entry => ds.CONFIG.equipment.armor[entry.value].kitEquipment);

    const weaponFormatter = game.i18n.getListFormatter({ type: "unit" });
    const weaponList = Array.from(this.equipment.weapon).map(w => ds.CONFIG.equipment.weapon[w]?.label ?? w);
    context.weaponLabel = weaponFormatter.format(weaponList);
  }
}
