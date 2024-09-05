import {barAttribute, requiredInteger} from "../helpers.mjs";
import BaseActorModel from "./base.mjs";

/**
 * Characters are controlled by players and have heroic resources and advancement
 */
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
      primary: new fields.SchemaField({
        value: new fields.NumberField({initial: 0, min: 0, integer: true, nullable: false})
      }),
      secondary: new fields.SchemaField({
        value: new fields.NumberField({initial: null, min: 0, integer: true})
      }),
      xp: requiredInteger({initial: 0}),
      recoveries: barAttribute(8, 0),
      victories: requiredInteger({initial: 0}),
      renown: requiredInteger({initial: 0}),
      skills: new fields.SetField(new fields.StringField({choices: ds.CONFIG.skills.list}))
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
      this.hero.primary.label = this.class.system.primary;
      this.hero.secondary.label = this.class.system.secondary;
    }
  }

  /**
   * @typedef {import("../../documents/item.mjs").DrawSteelItem} DrawSteelItem
   */

  /**
   * Finds the actor's current ancestry
   * @returns {undefined | DrawSteelItem}
   */
  get ancestry() {
    return this.parent.items.find(i => i.type === "ancestry");
  }

  /**
   * Finds the actor's current career
   * @returns {undefined | DrawSteelItem}
   */
  get career() {
    return this.parent.items.find(i => i.type === "career");
  }

  /**
   * Finds the actor's current class
   * @returns {undefined | DrawSteelItem}
   */
  get class() {
    return this.parent.items.find(i => i.type === "class");
  }

  /**
   * Finds the actor's current culture
   * @returns {undefined | DrawSteelItem}
   */
  get culture() {
    return this.parent.items.find(i => i.type === "culture");
  }

  /**
   * Returns all of the actor's kits
   * @returns {DrawSteelItem[]}
   */
  get kits() {
    return this.parent.items.filter(i => i.type === "kit");
  }

  /**
   * Returns the number of victories required to ascend to the next level
   */
  get victoriesMax() {
    if (!this.class) return 0;
    return ds.CONFIG.hero.xp_track[this.class.system.level];
  }
}
