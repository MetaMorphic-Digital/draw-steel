import { systemID, systemPath } from "../../constants.mjs";
import BaseActorModel from "./base-actor.mjs";
import ObjectSizeModel from "../models/object-size.mjs";
import SourceModel from "../models/source.mjs";
import { characteristics } from "../../config.mjs";

/**
 * Inanimate matter, including walls, rocks, vehicles, and corpses (the kind that can’t move around and bite you), as well as living non-creatures such as plants.
 */
export default class ObjectModel extends BaseActorModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "object",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.SOURCE",
    "DRAW_STEEL.Actor.object",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Objects have default null movement
    const speedField = schema.movement.getField("value");
    speedField.nullable = speedField.options.nullable = true;
    speedField.initial = speedField.options.initial = null;
    const disengageField = schema.movement.getField("disengage");
    disengageField.nullable = disengageField.options.nullable = true;
    disengageField.initial = disengageField.options.initial = null;

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.ev = new fields.NumberField({ required: true, integer: true });

    schema.object = new fields.SchemaField({
      level: new fields.NumberField({ required: true, integer: true }),
      category: new fields.StringField({ required: true }),
      role: new fields.StringField({ required: true }),
      area: new fields.StringField({ required: true }),
      squareStamina: new fields.BooleanField(),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _sizeModel() {
    return ObjectSizeModel;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get level() {
    return this.object.level;
  }

  /* -------------------------------------------------- */

  /**
   * Simple getter to indicate this counts as an object for targeting purposes.
   * @returns {boolean}
   */
  get isObject() {
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData();

    const categories = ds.CONFIG.objects.categories;
    this.object.categoryLabel = categories[this.object.category]?.label ?? "";

    const roles = ds.CONFIG.objects.roles;
    this.object.roleLabel = roles[this.object.role]?.label ?? "";

    // == null covers null & undefined
    if (this.ev == null) this.evLabel = "—";
    else {
      const evData = { value: this.ev, area: this.object.area };
      this.evLabel = this.object.area
        ? _loc("DRAW_STEEL.Actor.base.EVLabel.Area", evData)
        : _loc("DRAW_STEEL.Actor.base.EVLabel.Other", evData);
    }

    this.stamina.maxLabel = this.object.squareStamina
      ? _loc("DRAW_STEEL.Actor.object.MaxStaminaLabel.PerSquare", { value: this.stamina.max })
      : String(this.stamina.max);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options) {
    config.inline = true;

    const context = {
      actor: this.parent,
      damageIW: this._getImmunitiesWeaknesses(),
      itemEmbeds: await this._getItemEmbeds(config),
      movement: this._getMovement(true).list,
      system: this,
      systemFields: this.schema.fields,
    };

    const embed = document.createElement("div");

    embed.classList.add("draw-steel", "actor", "npc", "object", this.object.role || "no-role");
    
    embed.innerHTML = await foundry.applications.handlebars.renderTemplate(systemPath("templates/embeds/actor/object.hbs"), context);
    
    return embed;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare embeds of Items for the Object embed.
   * @param {DocumentHTMLEmbedConfig} config  Configuration for embedding behavior.
   * @returns {Promise<HTMLElement[]>}
   */
  async _getItemEmbeds(config) {
    let abilities = this._getOrderedAbilities(config);
    const { startFeatures, endFeatures } = this._getOrderedFeatures();
    const orderedItems = [...startFeatures, ...abilities, ...endFeatures];

    return Promise.all(orderedItems.map(async (item) => {
      const embed = await item.system.toEmbed({ includeName: true });
      embed.icon = item.system.getStatBlockIcon?.();
      return embed;
    }));
  }

  /* -------------------------------------------------- */

  /**
   * Orders Ability Items in the same order
   * as the keys in ds.CONFIG.abilities.types.
   * @param {DocumentHTMLEmbedConfig} config  Configuration for embedding behavior.
   * @returns {DrawSteelItem[]}
   */
  _getOrderedAbilities(config) {
    const abilityTypes = Object.keys(ds.CONFIG.abilities.types);
    return this.parent.items.documentsByType.ability
      // Ancestry malice do not show by default
      .filter(i => config.showAll || (i.system.category !== "maliceAncestry"))
      .sort((a, b) => abilityTypes.indexOf(a.system.type) - abilityTypes.indexOf(b.system.type) || a.sort - b.sort);
  }

  /* -------------------------------------------------- */

  /**
   * Orders Feature Items via the `embedDisplay.displayAtEnd` flag.
   * @returns {{ startFeatures: DrawSteelItem[], endFeatures: DrawSteelItem[] }}
   */
  _getOrderedFeatures() {
    const features = this.parent.items.documentsByType.feature.toSorted((a, b) => a.sort - b.sort);

    const [ startFeatures, endFeatures ] = features.partition(f => {
      return !!f.getFlag(systemID, "embedDisplay.displayAtEnd");
    });
    return { startFeatures, endFeatures };
  }

  /* ------------------------------------------------- */

  /** @inheritdoc */
  onEmbed(element) {
    element.querySelector("a[data-action='openSheet']")?.addEventListener("click", () => this.parent.sheet.render({ force: true }));
  }

}
