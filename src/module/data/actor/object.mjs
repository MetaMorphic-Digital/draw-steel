import BaseActorModel from "./base-actor.mjs";
import SourceModel from "../models/source.mjs";
import { requiredInteger } from "../helpers.mjs";

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

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.ev = requiredInteger({ initial: 4 }),

    schema.object = new fields.SchemaField({
      category: new fields.StringField({ required: true }),
      role: new fields.StringField({ required: true }),
      area: new fields.StringField({ blank: false }),
    });

    return schema;
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

    const evData = { value: this.ev, area: this.object.area };
    this.evLabel = this.object.area
      ? game.i18n.format("DRAW_STEEL.Actor.base.EVLabel.Area", evData)
      : game.i18n.format("DRAW_STEEL.Actor.base.EVLabel.Other", evData);
  }
}
