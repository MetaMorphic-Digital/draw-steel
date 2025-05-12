import enrichHTML from "../../utils/enrichHTML.mjs";
import SourceModel from "../models/source.mjs";
import SubtypeModelMixin from "../subtype-model-mixin.mjs";

/** @import DrawSteelActor from "../../documents/actor.mjs" */

const fields = foundry.data.fields;

/**
 * A base item model that provides basic description and source metadata for an item instance
 * @extends foundry.abstract.TypeDataModel
 */
export default class BaseItemModel extends SubtypeModelMixin(foundry.abstract.TypeDataModel) {
  /**
   * Key information about this item subtype
   * @type {import("./_types").ItemMetaData}
   */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "base",
      invalidActorTypes: [],
    });
  }

  /** @inheritdoc */
  static defineSchema() {
    const schema = {};

    schema.description = new fields.SchemaField({
      value: new fields.HTMLField(),
      gm: new fields.HTMLField(),
    });

    schema.source = new fields.EmbeddedDataField(SourceModel);

    /**
     * The Draw Steel ID, indicating a unique game rules element
     */
    schema._dsid = new fields.StringField({ blank: false });

    return schema;
  }

  /**
   * Convenient access to the item's actor, if it exists.
   * @returns {DrawSteelActor | null}
   */
  get actor() {
    return this.parent.actor;
  }

  /** @inheritdoc */
  prepareDerivedData() {
    this.source.prepareData(this.parent._stats?.compendiumSource ?? this.parent.uuid);
  }

  /**
   * Prepare derived item data that requires actor derived actor data to be available
   */
  preparePostActorPrepData() {}

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (this.constructor.metadata.invalidActorTypes?.includes(this.parent.actor?.type)) return false;

    if (!this._dsid) this.updateSource({ _dsid: data.name.slugify({ strict: true }) });
  }

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    const enriched = await enrichHTML(this.description.value, { ...options, relativeTo: this.parent });

    const embed = document.createElement("div");
    embed.classList.add("draw-steel", this.parent.type);
    embed.innerHTML = enriched;

    return embed;
  }

  /**
   * Prepare type-specific data for the Item sheet.
   * @param {Record<string, unknown>} context  Sheet context data.
   * @returns {Promise<void>}
   */
  async getSheetContext(context) {}

  /**
   * Attach type-specific event listeners to details tab of the Item sheet.
   * @param {HTMLElement} htmlElement             The rendered HTML element for the part
   * @param {ApplicationRenderOptions} options    Rendering options passed to the render method
   * @protected
   */
  _attachPartListeners(htmlElement, options) {}

  /**
   * Perform item subtype specific modifications to the actor roll data
   * @param {object} rollData   Pointer to the roll data object
   */
  modifyRollData(rollData) {}
}
