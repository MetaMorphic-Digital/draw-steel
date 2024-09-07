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

    let kitBonuses = {};

    for (const kit of this.kits) {
      const kitData = kit.system;
      for (const [key, value] of Object.entries(kitData.bonuses)) {
        if (key === "damage") continue;
        if (key in kitBonuses) kitBonuses[key] = Math.max(kitBonuses[key], value);
        else kitBonuses[key] = value;
      }
    }

    this.stamina.max += kitBonuses["stamina"] ?? 0;
    this.movement.walk += kitBonuses["speed"] ?? 0;
    this.combat.stability += kitBonuses["stability"] ?? 0;
    this.combat.reach += kitBonuses["reach"] ?? 0;

    // damage, distance, and area are more complicated
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
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "ancestry", system: import("../item/ancestry.mjs").default})}
   */
  get ancestry() {
    return this.parent.items.find(i => i.type === "ancestry");
  }

  /**
   * Finds the actor's current career
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "career", system: import("../item/career.mjs").default})}
   */
  get career() {
    return this.parent.items.find(i => i.type === "career");
  }

  /**
   * Finds the actor's current class
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "class", system: import("../item/class.mjs").default})}
   */
  get class() {
    return this.parent.items.find(i => i.type === "class");
  }

  /**
   * Finds the actor's current culture
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "culture", system: import("../item/culture.mjs").default})}
   */
  get culture() {
    return this.parent.items.find(i => i.type === "culture");
  }

  /**
   * Returns all of the actor's kits
   * @returns {Array<Omit<DrawSteelItem, "type" | "system"> & { type: "kit", system: import("../item/kit.mjs").default }>}
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
