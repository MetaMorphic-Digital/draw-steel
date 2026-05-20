import { requiredInteger, setOptions } from "../helpers.mjs";
import AdvancementChain from "../../utils/advancement/chain.mjs";
import CreatureModel from "./creature.mjs";
import SourceModel from "../models/source.mjs";

/**
 * @import DrawSteelItem from "../../documents/item.mjs";
 */

/**
 * A follower who adventures alongside a hero.
 */
export default class RetainerModel extends CreatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "retainer",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.SOURCE",
    "DRAW_STEEL.Actor.retainer",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.retainer = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      role: new fields.StringField({ required: true }),
      mentor: new fields.ForeignDocumentField(foundry.documents.Actor),
    });

    schema.recoveries = new fields.SchemaField({
      value: requiredInteger(),
      max: requiredInteger({ initial: 6 }),
      bonus: requiredInteger({ persisted: false }),
      divisor: new fields.NumberField({ initial: 3, nullable: false, persisted: false }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData();

    // allows for stamina bonuses to apply first
    this.recoveries.recoveryValue = Math.floor(this.stamina.max / this.recoveries.divisor) + this.recoveries.bonus;

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;

    const roles = ds.CONFIG.monsters.roles;
    this.retainer.roleLabel = roles[this.retainer.role]?.label ?? "";

    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });

    const monsterKeywords = ds.CONFIG.monsters.keywords;
    const keywordList = Array.from(this.retainer.keywords).map(k => monsterKeywords[k]?.label).filter(_ => _);
    this.retainer.keywords.list = keywordList;
    this.retainer.keywords.labels = keywordFormatter.format(keywordList);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    }, data, { insertKeys: false, insertValues: false });

    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the retainer's stamina and reducing the number of recoveries.
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
   * Finds the actor's current class.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "class", system: import("../item/class.mjs").default})}
   */
  get class() {
    return this.parent.itemTypes.class.at(0);
  }

  /* -------------------------------------------------- */

  /**
   * Retainers don't have subclasses.
   * @type {Set<never>}
   */
  get subclasses() {
    return new Set();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get level() {
    return this.class?.system.level ?? 0;
  }

  /* -------------------------------------------------- */

  /**
   * Returns if this actor can level up.
   * @type {boolean}
   */
  get advancementReady() {
    return this.retainer.mentor?.system.level >= this.level;
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
    if (!cls && !item) throw new Error("A class item is required if a retainer has no current levels.");
    if (cls && item && (item.dsid !== cls.dsid))
      throw new Error("A class item cannot be provided for advancing when a hero already has a class.");
    if (levels < 1) throw new Error("A hero cannot advance a negative number of levels.");
    if (this.level + levels > ds.CONFIG.hero.xpTrack.length) {
      throw new Error(`A hero cannot advance beyond level ${ds.CONFIG.hero.xpTrack.length}.`);
    }

    if (!cls) await item.system.applyAdvancements({ actor: this.parent });
    else {

      const chain = new AdvancementChain(this.parent, { start: this.level + 1, end: this.level + levels });

      await chain.initializeRoots();

      const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
        chain,
        window: {
          title: _loc("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.levelUpTitle", { name: this.parent.name }),
        },
      });
      if (!configured) return;

      const toUpdate = { [cls.id]: { _id: cls.id, "system.level": chain.levelRange.end } };

      await chain.finalize({ toUpdate });
    }

    return this.class;
  }
}
