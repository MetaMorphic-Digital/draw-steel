import { DrawSteelActor, DrawSteelChatMessage } from "../../documents/_module.mjs";
import { DSRoll } from "../../rolls/base.mjs";
import { barAttribute, requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base.mjs";

/** @import DrawSteelItem from "../../documents/item.mjs" */

const fields = foundry.data.fields;

/**
 * Characters are controlled by players and have heroic resources and advancement
 */
export default class CharacterModel extends BaseActorModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "character",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.Character",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.hero = new fields.SchemaField({
      primary: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
      // Epic resources are not part of public license yet
      surges: requiredInteger({ initial: 0 }),
      xp: requiredInteger({ initial: 0 }),
      recoveries: barAttribute(8, 0),
      victories: requiredInteger({ initial: 0 }),
      renown: requiredInteger({ initial: 0 }),
      skills: new fields.SetField(setOptions()),
      preferredKit: new fields.DocumentIdField({ readonly: false }),
    });

    return schema;
  }

  /** @inheritdoc */
  static actorBiography() {
    const bio = super.actorBiography();

    bio.height = new fields.SchemaField({
      value: new fields.NumberField({ min: 0 }),
      units: new fields.StringField({ blank: false }),
    });

    bio.weight = new fields.SchemaField({
      value: new fields.NumberField({ min: 0 }),
      units: new fields.StringField({ blank: false }),
    });

    bio.age = new fields.StringField({ blank: false });

    return bio;
  }

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.hero.recoveries.bonus = 0;

    const kitBonuses = {
      stamina: 0,
      speed: 0,
      stability: 0,
    };

    /** @typedef {import("../item/kit.mjs").DamageSchema} DamageSchema */

    this.abilityBonuses = {
      /** @type {{ distance: number, damage?: DamageSchema}} */
      melee: {
        distance: 0,
      },
      /** @type {{ distance: number, damage?: DamageSchema}} */
      ranged: {
        distance: 0,
      },
    };

    for (const kit of this.kits) {
      const bonuses = kit.system.bonuses;
      kitBonuses.stamina = Math.max(kitBonuses.stamina, bonuses.stamina);
      kitBonuses.speed = Math.max(kitBonuses.speed, bonuses.speed);
      kitBonuses.stability = Math.max(kitBonuses.stability, bonuses.stability);

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

    this.stamina.max += kitBonuses["stamina"] * this.echelon;
    this.movement.value += kitBonuses["speed"];
    this.combat.stability += kitBonuses["stability"];
  }

  /** @inheritdoc */
  prepareDerivedData() {
    this.hero.recoveries.recoveryValue = Math.floor(this.stamina.max / 3) + this.hero.recoveries.bonus;
    this.hero.primary.label = game.i18n.localize("DRAW_STEEL.Actor.Character.FIELDS.hero.primary.value.label");
    const heroClass = this.class;
    if (heroClass && heroClass.system.primary) {
      this.hero.primary.label = heroClass.system.primary;
      // this.hero.secondary.label = this.class.system.secondary;
    }

    super.prepareDerivedData();

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;
  }

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    });
  }

  /** @inheritdoc */
  async startCombat(combatant) {
    await super.startCombat(combatant);
    await this.parent.update({ "system.hero.primary.value": this.hero.victories });
  }

  /** @inheritdoc */
  async _onStartTurn(combatant) {
    await super._onStartTurn(combatant);
    const characterClass = this.class;
    if (characterClass && characterClass.system.turnGain) {
      const recoveryRoll = new DSRoll(characterClass.system.turnGain, characterClass.getRollData(), {
        flavor: this.class.system.primary,
      });
      await recoveryRoll.toMessage({
        speaker: DrawSteelChatMessage.getSpeaker({ token: combatant.token }),
        flavor: game.i18n.localize("DRAW_STEEL.Actor.Character.HeroicResourceGain"),
      });
      await this.updateResource(recoveryRoll.total);
    }
  }

  /**
   * Take a respite resetting the character's stamina/recoveries and convert victories to XP
   * @returns {Promise<DrawSteelActor>}
   */
  async takeRespite() {
    return this.parent.update({
      system: {
        hero: {
          recoveries: {
            value: this.hero.recoveries.max,
          },
          victories: 0,
          xp: this.hero.xp + this.hero.victories,
        },
        stamina: {
          value: this.stamina.max,
        },
      },
    });
  }

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @returns {Promise<DrawSteelActor}
   */
  async spendRecovery() {
    if (this.hero.recoveries.value === 0) {
      ui.notifications.error("DRAW_STEEL.Actor.Character.SpendRecovery.Notifications.NoRecoveries", { format: { actor: this.parent.name } });
      return this.parent;
    }

    ui.notifications.success("DRAW_STEEL.Actor.Character.SpendRecovery.Notifications.Success", { format: { actor: this.parent.name } });
    await this.parent.update({ "system.hero.recoveries.value": this.hero.recoveries.value - 1 });

    return this.parent.modifyTokenAttribute("stamina", this.hero.recoveries.recoveryValue, true);
  }

  /**
   * Prompt the user to spend two hero tokens to regain stamina without spending a recovery
   * @returns {DrawSteelActor}
   */
  async spendStaminaHeroToken() {
    /** @type {HeroTokenModel} */
    const heroTokens = game.actors.heroTokens;

    const spend = await ds.applications.api.DSDialog.confirm({
      window: {
        title: "DRAW_STEEL.Setting.HeroTokens.RegainStamina.label",
      },
      content: `<p>${game.i18n.format("DRAW_STEEL.Setting.HeroTokens.RegainStamina.dialogContent", {
        value: heroTokens.value,
      })}</p>`,
    });

    if (spend) {
      const valid = await heroTokens.spendToken("regainStamina", { flavor: this.parent.name });
      if (valid !== false) {
        await this.parent.modifyTokenAttribute("stamina", this.hero.recoveries.recoveryValue, true);
      }
    }
    return this.parent;
  }

  /** @inheritdoc */
  get reach() {
    return 1 + this.abilityBonuses.melee.distance;
  }

  /** @inheritdoc */
  get level() {
    return this.class?.system.level ?? 0;
  }

  /** @inheritdoc */
  get coreResource() {
    return {
      name: this.class?.system.primary ?? game.i18n.localize("DRAW_STEEL.Actor.Character.FIELDS.hero.primary.value.label"),
      target: this.parent,
      path: "system.hero.primary.value",
    };
  }
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
   * Returns the total xp required for the next level
   */
  get nextLevelXP() {
    if (this.level >= ds.CONFIG.hero.xp_track.length) return 0;
    return ds.CONFIG.hero.xp_track[this.level];
  }

  /**
   * Returns the number of victories required to ascend to the next level
   */
  get victoriesMax() {
    return Math.max(0, this.nextLevelXP - this.hero.xp);
  }

  /** @inheritdoc */
  async updateResource(delta) {
    this.parent.update({ "system.hero.primary.value": this.hero.primary.value + delta });
  }
}
