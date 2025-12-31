import { systemID } from "../../constants.mjs";
import { DrawSteelActor, DrawSteelChatMessage } from "../../documents/_module.mjs";
import DSRoll from "../../rolls/base.mjs";
import BaseEffectModel from "../effect/base.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base.mjs";

/**
 * @import { DamageSchema } from "../pseudo-documents/power-roll-effects/_types";
 * @import DrawSteelItem from "../../documents/item.mjs";
 * @import ActiveEffectData from "@common/documents/_types.mjs";
 * @import AdvancementChain from "../../utils/advancement-chain.mjs";
 * @import { ActorData, ItemData } from "@common/documents/_types.mjs";
 */

const fields = foundry.data.fields;

/**
 * Heroes are controlled by players and have heroic resources and advancement.
 */
export default class HeroModel extends BaseActorModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "hero",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Actor.hero");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.stamina = new fields.SchemaField({
      value: new fields.NumberField({ initial: 20, nullable: false, integer: true }),
      temporary: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
    }, { trackedAttribute: true });

    schema.recoveries = new fields.SchemaField({
      value: requiredInteger(),
      max: requiredInteger({ max: 0 }),
    }),

    schema.hero = new fields.SchemaField({
      primary: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
      epic: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
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

    bio.age = new fields.StringField({ required: true });

    return bio;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    this.combat.initiativeThreshold = 6;

    this.recoveries.bonus = 0;
    this.recoveries.divisor = 3;

    const kitBonuses = {
      stamina: 0,
      speed: 0,
      stability: 0,
      disengage: 0,
    };

    const kitAbilityBonuses = {
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
        const current = foundry.utils.getProperty(kitAbilityBonuses, key);
        const kitValue = foundry.utils.getProperty(bonuses, key);
        foundry.utils.setProperty(kitAbilityBonuses, key, Math.max(current, kitValue));
      }

      for (const [type, obj] of Object.entries(kitAbilityBonuses)) {
        if (("damage" in obj) && (this.hero.preferredKit !== kit.id)) continue;
        for (const [key, value] of Object.entries(bonuses[type].damage)) {
          if (value) foundry.utils.setProperty(obj, `damage.${key}.value`, value);
        }
      }
    }

    this.stamina.max = kitBonuses["stamina"] * this.echelon;
    this.movement.kitBonus = kitBonuses["speed"];
    this.combat.stability += kitBonuses["stability"];
    this.movement.disengage += kitBonuses["disengage"];

    for (const keyword of ["melee", "ranged"]) {
      const bonuses = foundry.utils.flattenObject(kitAbilityBonuses[keyword]);
      for (const [key, value] of Object.entries(bonuses)) {
        if (value) {
          this._abilityBonuses.push({
            key,
            value,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            priority: 0,
            filters: {
              keywords: new Set([keyword, "weapon"]),
            },
          });
        }

      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    this.hero.primary.label = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");
    this.hero.epic.label = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.epic.value.label");
    const heroClass = this.class;
    if (heroClass) {
      if (heroClass.system.primary) this.hero.primary.label = heroClass.system.primary;
      if (heroClass.system.epic) this.hero.epic.label = heroClass.system.epic;
    }

    this.movement.value += this.movement.kitBonus;

    super.prepareDerivedData();

    // allows for stamina bonuses to apply first
    this.recoveries.recoveryValue = Math.floor(this.stamina.max / this.recoveries.divisor) + this.recoveries.bonus;

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;

    // Handling for trait advancements
    for (const skill of this._traits.skill ?? []) {
      if (skill in ds.CONFIG.skills.list) this.hero.skills.add(skill);
    }
    for (const lang of this._traits.language ?? []) {
      if (lang in ds.CONFIG.languages) this.biography.languages.add(lang);
    }
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
      updates.items = items.map(i => game.items.fromCompendium(i, { keepId: true, clearFolder: true }));
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
        flavor: game.i18n.localize("DRAW_STEEL.Actor.hero.HeroicResourceGain"),
      });
      await this.updateResource(recoveryRoll.total);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Take a respite resetting the hero's stamina and recoveries, converting victories
   * to XP, and disabling "Next Respite" active effects.
   * @returns {Promise<DrawSteelActor>}
   */
  async takeRespite() {
    /** @type {ActiveEffectData[]} */
    const updates = [];
    for (const effect of this.parent.appliedEffects) {
      if (!(effect.system instanceof BaseEffectModel)) continue;
      if (effect.system.end.type === "respite") updates.push({ _id: effect.id, disabled: true });
    }
    await this.parent.updateEmbeddedDocuments("ActiveEffect", updates);

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
   * Spend a recovery, adding to the hero's stamina and reducing the number of recoveries.
   * @returns {Promise<DrawSteelActor>}
   */
  async spendRecovery() {
    if (this.recoveries.value === 0) {
      ui.notifications.error("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.NoRecoveries", {
        format: { actor: this.parent.name },
      });
      return this.parent;
    }

    ui.notifications.success("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.Success", {
      format: { actor: this.parent.name },
    });
    await this.parent.update({ "system.recoveries.value": this.recoveries.value - 1 });

    return this.parent.modifyTokenAttribute("stamina", this.recoveries.recoveryValue, true);
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the user to spend two hero tokens to regain stamina without spending a recovery.
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

  /**
   * Internal record used to cache trait advancements to apply their changes during data prep.
   * This record is populated during `prepareEmbeddedDocuments`.
   * @type {Record<string, Set>}
   * @internal
   */
  _traits = {};

  /* -------------------------------------------------- */

  /**
   * Internal record used to cache trait advancements that did not select their full complement of choices.
   * Each entry is a set of advancement UUIDs.
   * This record is populated during `prepareEmbeddedDocuments`.
   * @type {Record<string, Set<string>>}
   * @internal
   */
  _unfilledTraits = {};

  /* -------------------------------------------------- */

  /**
   * Internal record used to cache advancements that can be repicked on respite.
   * Each entry is a set of advancement UUIDs.
   * This record is populated during `prepareEmbeddedDocuments`.
   * @type {Record<"activity" | "finish", Set<string>>}
   * @internal
   */
  _respiteAdvancements = {};

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
      name: this.class?.system.primary ?? game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label"),
      target: this.parent,
      path: "system.hero.primary.value",
      minimum,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current ancestry.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "ancestry", system: import("../item/ancestry.mjs").default})}
   */
  get ancestry() {
    return this.parent.itemTypes.ancestry[0];
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current career.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "career", system: import("../item/career.mjs").default})}
   */
  get career() {
    return this.parent.itemTypes.career[0];
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current class.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "class", system: import("../item/class.mjs").default})}
   */
  get class() {
    return this.parent.itemTypes.class[0];
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current subclasses.
   * @returns {Set<(Omit<DrawSteelItem, "type" | "system"> & { type: "subclass", system: import("../item/subclass.mjs").default})>}
   */
  get subclasses() {
    return new Set(this.parent.itemTypes.subclass);
  }

  /* -------------------------------------------------- */

  /**
   * Finds the actor's current culture.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "culture", system: import("../item/culture.mjs").default})}
   */
  get culture() {
    return this.parent.itemTypes.culture[0];
  }

  /* -------------------------------------------------- */

  /**
   * Returns all of the actor's kits.
   * @returns {Array<Omit<DrawSteelItem, "type" | "system"> & { type: "kit", system: import("../item/kit.mjs").default }>}
   */
  get kits() {
    return this.parent.itemTypes.kit;
  }

  /* -------------------------------------------------- */

  /**
   * Returns the total xp required for the next level.
   * @type {number | null} Null if there is no next level
   */
  get nextLevelXP() {
    if (this.level >= ds.CONFIG.hero.xpTrack.length) return null;
    return ds.CONFIG.hero.xpTrack[this.level];
  }

  /* -------------------------------------------------- */

  /**
   * Returns if this actor can level up.
   * @type {boolean}
   */
  get advancementReady() {
    return this.hero.xp >= (this.nextLevelXP ?? Infinity);
  }

  /* -------------------------------------------------- */

  /**
   * Returns the number of victories required to ascend to the next level.
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
    if (this.level + levels > ds.CONFIG.hero.xpTrack.length) {
      throw new Error(`A hero cannot advance beyond level ${ds.CONFIG.hero.xpTrack.length}.`);
    }

    if (!cls) item.system.applyAdvancements({ actor: this.parent });
    else {
      const levelRange = { start: this.level + 1, end: this.level + levels };
      const chains = (await Promise.all(this.parent.items.map(i => {
        if (i.supportsAdvancements) return i.system.createChains(levelRange.start, levelRange.end);
        return [];
      }))).flat();

      const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
        chains, actor: this.parent, window: {
          title: game.i18n.format("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.levelUpTitle", { name: this.parent.name }),
        },
      });
      if (!configured) return;

      const toUpdate = { [cls.id]: { _id: cls.id, "system.level": levelRange.end } };

      this._finalizeAdvancements({ chains, toUpdate }, { levels: levelRange });
    }

    return this.class;
  }

  /* -------------------------------------------------- */

  /**
   * Perform document operations for advancements.
   * @param {object} config
   * @param {AdvancementChain[]} config.chains
   * @param {ItemData[]} [config.toCreate={}]
   * @param {ItemData[]} [config.toUpdate={}]
   * @param {ActorData} [config.actorUpdate={}]
   * @param {Map<string>} [config._idMap]
   * @param {object} [options]                                      Operation options.
   * @param {{ start: number, end: number }} [options.levels]       Level information about these advancements.
   * @returns {[DrawSteelItem[], DrawSteelItem[], DrawSteelActor]}
   * @internal          End consumers should use the {@link advance}, AdvancementModel#applyAdvancements,
   *                    or ItemGrantAdvancement#reconfigure methods
   */
  async _finalizeAdvancements(
    { chains, toCreate = {}, toUpdate = {}, actorUpdate = {}, _idMap = new Map() },
    { levels } = {},
  ) {
    // First gather all new items that are to be created.
    for (const chain of chains) for (const node of chain.active()) {
      if (node.advancement.type === "itemGrant") {
        const parentItem = node.advancement.document;

        for (const uuid of node.chosenSelection ?? []) {
          const item = node.choices[uuid].item;
          const keepId = !this.parent.items.has(item.id) && !Array.from(_idMap.values()).includes(item.id);
          const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
          if (!keepId) itemData._id = foundry.utils.randomID();
          toCreate[item.uuid] = itemData;
          _idMap.set(item.id, itemData._id);
          itemData._parentId = parentItem.id;
          itemData._advId = node.advancement.id;
        }
      }
    }

    // Apply flags to store "parent" item's id and origin advancement.
    for (const uuid in toCreate) {
      const itemData = toCreate[uuid];
      const { _parentId, _advId } = itemData;
      delete itemData._parentId;
      delete itemData._advId;

      // Fall back to the _parentId, in the case of existing items being
      // updated to grant more items (eg a class leveling up).
      const parentId = _idMap.get(_parentId) ?? _parentId;
      foundry.utils.setProperty(itemData, `flags.${systemID}.advancement`, { parentId: parentId, advancementId: _advId });
    }

    // Perform item data modifications or store item updates.
    for (const chain of chains) for (const node of chain.active()) {
      if (node.advancement.isTrait || (node.advancement.type === "characteristic")) {
        const { document: item, id } = node.advancement;
        const isExisting = item.parent === this.parent;
        let itemData;

        if (isExisting) {
          toUpdate[item.id] ??= { _id: item.id };
          itemData = toUpdate[item.id];
        } else {
          itemData = toCreate[item.uuid];
        }

        foundry.utils.setProperty(itemData, `flags.${systemID}.advancement.${id}.selected`, node.chosenSelection);
      }
    }

    const operationOptions = {};
    if (levels) operationOptions.levels = levels;

    return await Promise.all([
      this.parent.createEmbeddedDocuments("Item", Object.values(toCreate), { keepId: true, ds: operationOptions }),
      this.parent.updateEmbeddedDocuments("Item", Object.values(toUpdate), { ds: operationOptions }),
      this.parent.update(actorUpdate, { ds: operationOptions }),
    ]);
  }
}
