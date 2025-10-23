import enrichHTML from "../../utils/enrich-html.mjs";
import SourceModel from "../models/source.mjs";
import DrawSteelSystemModel from "../system-model.mjs";

/** @import DrawSteelActor from "../../documents/actor.mjs" */

const fields = foundry.data.fields;

/**
 * A base item model that provides basic description and source metadata for an item instance.
 */
export default class BaseItemModel extends DrawSteelSystemModel {
  /**
   * Key information about this item subtype.
   * @type {import("./_types").ItemMetaData}
   */
  static get metadata() {
    return {
      ...super.metadata,
      type: "base",
      invalidActorTypes: [],
      packOnly: false,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = {};

    schema.description = new fields.SchemaField({
      value: new fields.HTMLField(),
      // gmOnly doesn't do anything client-side currently, handled in system.json declaration
      director: new fields.HTMLField({ gmOnly: true }),
    });

    schema.source = new fields.EmbeddedDataField(SourceModel);

    /**
     * The Draw Steel ID, indicating a unique game rules element.
     * @remarks `readonly: true` makes this non-iterable
     */
    schema._dsid = new fields.StringField({
      required: true,
      readonly: true,
      validate: string => string === string.slugify({ strict: true }),
      validationError: game.i18n.localize("DRAW_STEEL.SOURCE.InvalidDSID"),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Item.base",
    "DRAW_STEEL.SOURCE",
  ];

  /* -------------------------------------------------- */

  /**
   * Convenient access to the item's actor, if it exists.
   * @returns {DrawSteelActor | null}
   */
  get actor() {
    return this.parent.actor;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare derived item data that requires actor derived actor data to be available.
   */
  preparePostActorPrepData() {}

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (this.constructor.metadata.invalidActorTypes?.includes(this.parent.actor?.type)) return false;

    const updates = {};

    const compendium = game.packs.get(this.parent.pack);
    if (compendium) {
      if (compendium.metadata.packageType === "system") foundry.utils.setProperty(updates, "source.license", "Draw Steel Creator License");
      else if (compendium.metadata.packageType === "module") {
        const m = game.modules.get(compendium.metadata.packageName);
        const defaultBook = foundry.utils.getProperty(m, "flags.draw-steel.defaultBook");
        if (defaultBook) foundry.utils.setProperty(updates, "source.book", defaultBook);
        const defaultLicense = foundry.utils.getProperty(m, "flags.draw-steel.defaultLicense");
        if (defaultLicense) foundry.utils.setProperty(updates, "source.license", defaultLicense);
      }
    }

    if (!this._dsid) updates._dsid = data.name.slugify({ strict: true });

    if (!foundry.utils.isEmpty(updates)) this.updateSource(updates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    const enriched = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", this.parent.type);
    embed.innerHTML = enriched;

    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare type-specific data for the Item sheet.
   * @param {Record<string, unknown>} context  Sheet context data.
   * @returns {Promise<void>}
   */
  async getSheetContext(context) {}

  /* -------------------------------------------------- */

  /**
   * Attach type-specific event listeners to details tab of the Item sheet.
   * @param {HTMLElement} htmlElement             The rendered HTML element for the part.
   * @param {ApplicationRenderOptions} options    Rendering options passed to the render method.
   * @protected
   */
  _attachPartListeners(htmlElement, options) {}

  /* -------------------------------------------------- */

  /**
   * Perform item subtype specific modifications to the actor roll data.
   * @param {object} rollData   Pointer to the roll data object.
   */
  modifyRollData(rollData) {}
}
