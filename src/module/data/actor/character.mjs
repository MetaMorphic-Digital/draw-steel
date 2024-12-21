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
      skills: new fields.SetField(new fields.StringField({blank: false, required: true})),
      preferredKit: new fields.DocumentIdField()
    });

    return schema;
  }

  static actorBiography() {
    const fields = foundry.data.fields;
    const bio = super.actorBiography();

    bio.height = new fields.SchemaField({
      value: new fields.NumberField({min: 0}),
      units: new fields.StringField({blanK: false})
    });

    bio.weight = new fields.SchemaField({
      value: new fields.NumberField({min: 0}),
      units: new fields.StringField({blanK: false})
    });

    bio.age = new fields.StringField({blank: false});

    return bio;
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    this.hero.recoveries.bonus = 0;

    const kitBonuses = {
      stamina: 0,
      speed: 0,
      stability: 0
    };

    /** @typedef {import("../item/kit.mjs").DamageSchema} DamageSchema */

    this.abilityBonuses = {
      /** @type {{ distance: number, damage?: DamageSchema}} */
      melee: {
        distance: 0
      },
      /** @type {{ distance: number, damage?: DamageSchema}} */
      ranged: {
        distance: 0
      },
      /** @type {{ distance: number, area: number, damage?: DamageSchema }} */
      magic: {
        distance: 0,
        area: 0
      }
    };

    for (const kit of this.kits) {
      const bonuses = kit.system.bonuses;
      kitBonuses.stamina = Math.max(kitBonuses.stamina, bonuses.stamina);
      kitBonuses.speed = Math.max(kitBonuses.speed, bonuses.speed);
      kitBonuses.stamina = Math.max(kitBonuses.stamina, bonuses.stamina);

      const abiBonuses = ["melee.distance", "ranged.distance"];

      for (const key of abiBonuses) {
        const current = foundry.utils.getProperty(this.abilityBonuses, key);
        const kitValue = foundry.utils.getProperty(bonuses, key);
        foundry.utils.setProperty(this.abilityBonuses, key, Math.max(current, kitValue));
      }

      for (const [type, obj] of Object.entries(this.abilityBonuses)) {
        if (("damage" in obj) && (this.hero.preferredKit !== kit.id)) continue;
        if (Object.values(bonuses[type].damage).some(v => v)) obj.damage = bonuses[type].damage;
      }
    }

    this.stamina.max += kitBonuses["stamina"];
    this.movement.walk += kitBonuses["speed"];
    this.combat.stability += kitBonuses["stability"];
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

  /** @override */
  get reach() {
    return 1 + this.abilityBonuses.melee.distance;
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
