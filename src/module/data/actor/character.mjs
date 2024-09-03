import {barAttribute, requiredInteger} from "../_helpers.mjs";
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
    const schema = super.defineSchema();

    schema.hero = new fields.SchemaField({
      // Some classes have a second resource
      resourceOne: new fields.SchemaField({
        value: new fields.NumberField({initial: 0, min: 0, integer: true, nullable: false})
      }),
      resourceTwo: new fields.SchemaField({
        value: new fields.NumberField({initial: null, min: 0, integer: true})
      }),
      xp: requiredInteger({initial: 0}),
      recoveries: barAttribute(8),
      victories: requiredInteger({initial: 0}),
      renown: requiredInteger({initial: 0}),
      skills: new fields.SetField(new fields.StringField({choices: CONFIG.DRAW_STEEL.skills.list}))
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
    if (this.class) {
      this.hero.resourceOne.label = this.class.system.resourceOne;
      this.hero.resourceTwo.label = this.class.system.resourceTwo;
    }
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

  /**
   * Returns the number of victories required to ascend to the next level
   */
  get victoriesMax() {
    if (!this.class) return 0;
    return CONFIG.DRAW_STEEL.hero.xp_track[this.class.system.level];
  }
}
