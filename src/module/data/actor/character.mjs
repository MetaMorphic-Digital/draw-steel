import { systemID } from "../../constants.mjs";
import { DrawSteelActor, DrawSteelChatMessage } from "../../documents/_module.mjs";
import DSRoll from "../../rolls/base.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base.mjs";

/** @import DrawSteelItem from "../../documents/item.mjs" */

const fields = foundry.data.fields;

/**
 * Characters are controlled by players and have heroic resources and advancement
 */
export default class CharacterModel extends BaseActorModel {
  /**
   * @inheritdoc
   * @type {import("../_types").SubtypeMetadata}
   */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "character",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.character");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // TODO: Improve the handling of TokenDocument._getTrackedAttributesFromSchema
    // So that it recognizes derived max stamina & recovery values without them being in the schema
    const maxStamina = schema.stamina.getField("max");
    maxStamina.options.max = 0;
    maxStamina.max = 0;

    schema.recoveries = new fields.SchemaField({
      value: requiredInteger(),
      max: requiredInteger({ max: 0 }),
    }),

    schema.hero = new fields.SchemaField({
      primary: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
      // Epic resources are not part of public license yet
      surges: requiredInteger(),
      xp: requiredInteger(),
      victories: requiredInteger(),
      renown: requiredInteger(),
      wealth: requiredInteger({ initial: 1 }),
      skills: new fields.SetField(setOptions()),
      preferredKit: new fields.DocumentIdField({ readonly: false }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static actorBiography() {
    const bio = super.actorBiography();

    bio.height = new fields.SchemaField({
      value: new fields.NumberField({ min: 0 }),
      units: new fields.StringField({ blank: false, required: true, initial: "inches" }),
    });

    bio.weight = new fields.SchemaField({
      value: new fields.NumberField({ min: 0 }),
      units: new fields.StringField({ blank: false, required: true, initial: "pounds" }),
    });

    bio.age = new fields.StringField({ blank: false });

    return bio;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.recoveries.bonus = 0;

    const kitBonuses = {
      stamina: 0,
      speed: 0,
      stability: 0,
      disengage: 0,
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
      kitBonuses.disengage = Math.max(kitBonuses.disengage, bonuses.disengage);

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
    this.movement.disengage += kitBonuses["disengage"];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    this.recoveries.recoveryValue = Math.floor(this.stamina.max / 3) + this.recoveries.bonus;

    this.hero.primary.label = game.i18n.localize("DRAW_STEEL.Actor.character.FIELDS.hero.primary.value.label");
    const heroClass = this.class;
    if (heroClass && heroClass.system.primary) {
      this.hero.primary.label = heroClass.system.primary;
      // this.hero.secondary.label = this.class.system.secondary;
    }

    super.prepareDerivedData();

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const updates = {
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    };

    const stats = this.parent._stats;

    if (!stats.duplicateSource && !stats.compendiumSource && !stats.exportSource) {
      const items = await Promise.all(ds.CONFIG.hero.defaultItems.map(uuid => fromUuid(uuid)));
      // updateSource will merge the arrays for embedded collections
      updates.items = items.map(i => game.items.fromCompendium(i));
    }

    this.parent.updateSource(updates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async startCombat(combatant) {
    await super.startCombat(combatant);
    await this.parent.update({ "system.hero.primary.value": this.hero.victories });
  }

  /* -------------------------------------------------- */

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
        flavor: game.i18n.localize("DRAW_STEEL.Actor.character.HeroicResourceGain"),
      });
      await this.updateResource(recoveryRoll.total);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Take a respite resetting the character's stamina/recoveries and convert victories to XP
   * @returns {Promise<DrawSteelActor>}
   */
  async takeRespite() {
    return this.parent.update({
      system: {
        recoveries: {
          value: this.recoveries.max,
        },
        hero: {
          victories: 0,
          xp: this.hero.xp + this.hero.victories,
        },
        stamina: {
          value: this.stamina.max,
        },
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the character's stamina and reducing the number of recoveries
   * @returns {Promise<DrawSteelActor}
   */
  async spendRecovery() {
    if (this.recoveries.value === 0) {
      ui.notifications.error("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.NoRecoveries", { format: { actor: this.parent.name } });
      return this.parent;
    }

    ui.notifications.success("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.Success", { format: { actor: this.parent.name } });
    await this.parent.update({ "system.recoveries.value": this.recoveries.value - 1 });

    return this.parent.modifyTokenAttribute("stamina", this.recoveries.recoveryValue, true);
  }

  /* -------------------------------------------------- */

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
        await this.parent.modifyTokenAttribute("stamina", this.recoveries.recoveryValue, true);
      }
    }
    return this.parent;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get reach() {
    return 1 + this.abilityBonuses.melee.distance;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get level() {
    return this.class?.system.level ?? 0;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get coreResource() {
    let minimum = 0;
    const classModel = this.class?.system;
    if (classModel) minimum = ds.utils.evaluateFormula(classModel.minimum, classModel.parent.getRollData());

    return {
      name: this.class?.system.primary ?? game.i18n.localize("DRAW_STEEL.Actor.character.FIELDS.hero.primary.value.label"),
      target: this.parent,
      path: "system.hero.primary.value",
      minimum,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current ancestry
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "ancestry", system: import("../item/ancestry.mjs").default})}
   */
  get ancestry() {
    return this.parent.items.find(i => i.type === "ancestry");
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current career
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "career", system: import("../item/career.mjs").default})}
   */
  get career() {
    return this.parent.items.find(i => i.type === "career");
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current class
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "class", system: import("../item/class.mjs").default})}
   */
  get class() {
    return this.parent.items.find(i => i.type === "class");
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current culture
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "culture", system: import("../item/culture.mjs").default})}
   */
  get culture() {
    return this.parent.items.find(i => i.type === "culture");
  }

  /* -------------------------------------------------- */

  /**
   * Returns all of the actor's kits
   * @returns {Array<Omit<DrawSteelItem, "type" | "system"> & { type: "kit", system: import("../item/kit.mjs").default }>}
   */
  get kits() {
    return this.parent.items.filter(i => i.type === "kit");
  }

  /* -------------------------------------------------- */

  /**
   * Returns the total xp required for the next level
   */
  get nextLevelXP() {
    if (this.level >= ds.CONFIG.hero.xp_track.length) return 0;
    return ds.CONFIG.hero.xp_track[this.level];
  }

  /* -------------------------------------------------- */

  /**
   * Returns the number of victories required to ascend to the next level
   */
  get victoriesMax() {
    return Math.max(0, this.nextLevelXP - this.hero.xp);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async updateResource(delta) {
    this.parent.modifyTokenAttribute("hero.primary.value", delta, true, false);
  }

  /* -------------------------------------------------- */

  /**
   * Advance a given number of levels.
   * @param {object} [options={}]                           Options to modify the advancement of levels.
   * @param {number} [options.levels=1]                     The number of levels to advance.
   * @param {foundry.documents.Item} [options.item=null]    For a hero with no current levels, a class item.
   */
  async advance({ levels = 1, item = null } = {}) {
    let cls = this.class;

    if (item && (item.type !== "class")) throw new Error("The item provided for advancing must be a class item.");
    if (!cls && !item) throw new Error("A class item is required if a hero has no current levels.");
    if (cls && item && (item.dsid !== cls.dsid))
      throw new Error("A class item cannot be provided for advancing when a hero already has a class.");
    if (levels < 1) throw new Error("A hero cannot advance a negative number of levels.");
    if (this.level + levels > 10) throw new Error("A hero cannot advance beyond level 10.");

    cls = cls ? cls : item;
    const range = [this.level + 1, this.level + levels];
    const advancements = cls.getEmbeddedPseudoDocumentCollection("Advancement");
    const chains = [];
    for (const advancement of advancements) {
      const validRange = advancement.levels.some(level => level.between(...range));
      if (validRange) chains.push(await ds.utils.AdvancementChain.create(advancement));
    }

    const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chains, actor: this.parent,
    });
    if (!configured) return;

    const toCreate = {}; // Record of original items' uuids to the to-be-created item data (may have `_id` if allowed).
    const toUpdate = {}; // Record of existing items' ids to the updates to be performed.
    const actorUpdate = {};

    // Should the class item be created?
    const createClass = cls !== this.class;
    if (createClass) {
      const keepId = !this.parent.items.has(cls.id);
      const itemData = game.items.fromCompendium(cls, { keepId });
      foundry.utils.setProperty(itemData, "system.level", range[1]);
      toCreate[cls.uuid] = itemData;
    } else {
      toUpdate[cls.id] = { _id: cls.id, "system.level": range[1] };
    }

    // TODO: store id of the "parent" item to allow for later recursive deletion.

    // First gather all new items that are to be created.
    for (const chain of chains) for (const node of chain.active()) {
      if (node.advancement.type !== "itemGrant") continue;

      for (const uuid of node.chosenSelection) {
        const item = node.choices[uuid].item;
        const keepId = !this.parent.items.has(item.id) && !(item.id in toCreate);
        const itemData = game.items.fromCompendium(item, { keepId });
        toCreate[item.uuid] = itemData;
      }
    }

    // Perform item data modifications or store item updates.
    for (const chain of chains) for (const node of chain.active()) {
      if (!node.advancement.isTrait) continue;
      const item = node.advancement.document;
      const isExisting = item.parent === this.parent;
      let itemData;
      if (isExisting) {
        toUpdate[item.id] ??= { _id: item.id };
        itemData = toUpdate[item.id];
      } else {
        itemData = toCreate[item.uuid];
      }

      foundry.utils.setProperty(itemData, `flags.${systemID}.advancement.${node.advancement.id}.selected`, node.chosenSelection);
    }

    await Promise.all([
      this.parent.createEmbeddedDocuments("Item", Object.values(toCreate)),
      this.parent.updateEmbeddedDocuments("Item", Object.values(toUpdate)),
      this.parent.update(actorUpdate),
    ]);

    return this.class;
  }
}
