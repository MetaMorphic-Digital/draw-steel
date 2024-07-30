import {barAttribute} from "./_helpers.mjs";
import BaseActorModel from "./base.mjs";

export default class CharacterModel extends BaseActorModel {
  static metadata = Object.freeze({
    type: "character"
  });

  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.Character"
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = (initial) => ({initial, required: true, nullable: false, integer: true, min: 0});
    const schema = super.defineSchema();

    schema.hero = new fields.SchemaField({
      // Some classes have a second resource
      resources: barAttribute(10),
      xp: new fields.NumberField(requiredInteger(0)),
      recoveries: barAttribute(8),
      victories: new fields.NumberField(requiredInteger(0)),
      renown: new fields.NumberField(requiredInteger(0))
    });

    return schema;
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    this.hero.recoveries.bonus = 0;
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.hero.recoveries.recoveryValue = Math.floor(this.stamina.max / 3) + this.hero.recoveries.bonus;
  }

  /**
   * Finds the actor's current ancestry
   */
  get ancestry() {
    return this.parent.items.find(i => i.type === "ancestry");
  }

  /**
   * Finds the actor's current career
   */
  get career() {
    return this.parent.items.find(i => i.type === "career");
  }

  /**
   * Finds the actor's current class
   */
  get class() {
    return this.parent.items.find(i => i.type === "class");
  }

  /**
   * Finds the actor's current culture
   */
  get culture() {
    return this.parent.items.find(i => i.type === "culture");
  }

  /**
   * Returns all of the actor's kits
   */
  get kits() {
    return this.parent.items.filter(i => i.type === "kit");
  }
}
