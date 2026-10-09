import AdvancementChain from "../../utils/advancement/chain.mjs";
import CreatureModel from "./creature.mjs";
import DamagePowerRollEffect from "../pseudo-documents/power-roll-effects/damage-effect.mjs";
import DamageRoll from "../../rolls/damage.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import FormulaField from "../fields/formula-field.mjs";
import SourceModel from "../models/source.mjs";
import { setOptions } from "../helpers.mjs";

/**
 * @import DrawSteelItem from "../../documents/item.mjs";
 * @import { Skills } from "./_types";
 */

/**
 * A wild animal who has forged a mystical bond with a Beastheart.
 */
export default class CompanionModel extends CreatureModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "companion",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat([
    "DRAW_STEEL.SOURCE",
    "DRAW_STEEL.Actor.companion",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.stamina.fields.max.persisted = schema.stamina.fields.max.options.persisted = false;

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.companion = new fields.SchemaField({
      freeStrike: new FormulaField({ initial: "1 + @M", deterministic: true }),
      keywords: new fields.SetField(setOptions(), { initial: ["animal"] }),
      master: new fields.ForeignDocumentField(foundry.documents.Actor),
      rampage: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      skills: new fields.SetField(setOptions()),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {

    const companionClass = this.class;
    // Non-beastheart classes might have fixed companion HP values rather than match their master
    const classStamina = companionClass?.system.stamina.starting || companionClass?.system.stamina.level;
    if (this.companion.master && !classStamina)
      Object.defineProperty(this.stamina, "max", {
        get: () => this.companion.master?.system.stamina.max,
        set: () => {},
      });

    super.prepareDerivedData();
    this.source.prepareData();

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;

    const keywordFormatter = game.i18n.getListFormatter({ type: "unit" });

    const monsterKeywords = ds.CONFIG.monsters.keywords;
    const keywordList = Array.from(this.companion.keywords).map(k => monsterKeywords[k]?.label).filter(_ => _);
    this.companion.keywords.list = keywordList;
    this.companion.keywords.labels = keywordFormatter.format(keywordList);
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
   * Finds the actor's current class.
   * @returns {undefined | (Omit<DrawSteelItem, "type" | "system"> & { type: "class", system: import("../item/class.mjs").default})}
   */
  get class() {
    return this.parent.itemTypes.class.at(0);
  }

  /* -------------------------------------------------- */

  /**
   * Companions don't have subclasses.
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

  /**
   * Returns if this actor can level up.
   * @type {boolean}
   */
  get advancementReady() {
    return this.companion.master?.system.level > this.level;
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
    if (!cls && !item) throw new Error("A class item is required if a companion has no current levels.");
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

  /* -------------------------------------------------- */

  /**
   * Create the class item for this companion.
   * @param {boolean} [renderSheet=true] Whether to render the new class.
   * @returns {Promise<DrawSteelItem | null>} The created class, or null if none was needed.
   */
  async fillClass(renderSheet = true) {
    if (this.class) return null;
    let companionClass = null;

    if (ds.CONFIG.companion.companionClasses.length === 1) companionClass = await fromUuid(ds.CONFIG.companion.companionClasses.at(0));
    else {
      const classOptions = ds.CONFIG.companion.companionClasses.map(uuid => ({ label: fromUuidSync(uuid).name, value: uuid }));
      const classSelect = foundry.applications.fields.createFormGroup({
        name: "uuid",
        label: "DRAW_STEEL.Actor.companion.ChooseClassDialog.InputLabel",
        input: foundry.applications.fields.createSelectInput({
          options: classOptions,
        }),
        localize: true,
      });

      const content = document.createElement("div");
      content.append(classSelect);

      const fd = await ds.applications.api.DSDialog.input({
        content,
        window: {
          title: "DRAW_STEEL.Actor.companion.ChooseClassDialog.Title",
          icon: "fa-solid fa-list-dropdown",
        },
      });
      if (!fd) return;

      companionClass = await fromUuid(fd.uuid);
    }

    const classData = game.items.fromCompendium(companionClass, { clearFolder: true });
    await this.actor.createEmbeddedDocuments("Item", [classData], { renderSheet: true });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get coreResource() {
    const masterResource = this.companion.master?.system.coreResource;
    if (!masterResource) return null;

    return {
      ...masterResource,
      tracking: this.companion.rampage,
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async updateResource(delta) {
    const master = this.companion.master;

    if (!master) return void ui.notifications.error("DRAW_STEEL.Actor.companion.NoMaster", { localize: true });
    return this.companion.master.modifyTokenAttribute("hero.primary.value", delta, true, false);
  }

  /* -------------------------------------------------- */

  /**
   * Recovery info from the companion's master.
   * @returns {{ value: number; max: number; recoveryValue: number }} Values will be null if no master is present.
   */
  get recoveries() {
    const master = this.companion.master;

    if (master) return { ...master.system.recoveries };
    else return { max: null, value: null, recoveryValue: null };
  }

  /* -------------------------------------------------- */

  /**
   * The skills this companion has.
   * @returns {Skills}
   */
  get skills() {
    const master = this.companion.master;

    if (master) return master.system.skills;

    const list = this.companion.skills.reduce((skills, skill) => {
      skill = ds.CONFIG.skills.list[skill]?.label;
      if (skill) skills.push(skill);
      return skills;
    }, []).sort((a, b) => a.localeCompare(b, game.i18n.lang));

    return {
      value: this.companion.skills,
      modifiers: {},
      list: game.i18n.getListFormatter().format(list),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the companion's stamina and reducing the number of recoveries.
   * @returns {Promise<DrawSteelActor>}
   */
  async spendRecovery() {
    const master = this.companion.master;

    if (!master) {
      ui.notifications.error("DRAW_STEEL.Actor.companion.NoMaster", { format: { companion: this.parent.name } });
      return this.parent;
    }

    const recoveryInfo = this.recoveries;

    if (recoveryInfo.value === 0) {
      ui.notifications.error("DRAW_STEEL.Actor.base.SpendRecovery.Notifications.NoRecoveries", {
        format: { actor: master.name },
      });
      return this.parent;
    }

    ui.notifications.success("DRAW_STEEL.Actor.companion.SpendRecovery.Notifications.Success", {
      format: { master: master.name, companion: this.parent.name },
    });
    await master.update({ "system.recoveries.value": recoveryInfo.value - 1 });

    return this.parent.modifyTokenAttribute("stamina", recoveryInfo.recoveryValue, true);
  }

  /* -------------------------------------------------- */

  /**
   * Fetch the traits of this creature's free strike.
   * The value is stored in `this.companion.freeStrike`.
   * @returns {import("./_types").FreeStrike}
   */
  get freeStrike() {
    /** @type {DrawSteelItem & {system: AbilityModel}} */
    const signature = this.parent.items.documentsByType.ability.find(item => item.system.category === "signature");
    /** @type {Set<string>} */
    const keywords = new Set(["magic", "psionic", "weapon"]).intersection(signature?.system.keywords ?? new Set());

    /** @type {DamagePowerRollEffect} */
    const [firstDamage] = signature?.system.power.effects.documentsByType.damage ?? [];

    const freeStrike = {
      value: ds.utils.evaluateFormula(this.companion.freeStrike, this.parent.getRollData()),
      keywords: keywords.add("strike"),
      type: firstDamage?.damage.tier1.types.first() ?? "",
      range: {
        melee: 1,
      },
    };

    if (signature && signature.system.keywords.has("strike")) freeStrike.value += (firstDamage?.damage.bonuses.value ?? 0);
    else {
      const replacementData = this.parent.getRollData();
      const field = DamagePowerRollEffect.schema.getField("damage.bonuses.value");
      for (const bonus of this._abilityBonuses) {
        if (bonus.key !== "damage.bonuses.value") continue;
        if (!bonus.filters.keywords.isSubsetOf(freeStrike.keywords)) continue;
        foundry.utils.setProperty(freeStrike, "value", field.applyChange(freeStrike.value, this, bonus, { replacementData }));
      }
    }

    switch (signature?.system.distance.type) {
      case "melee":
        freeStrike.range.melee = Math.max(1, signature.system.distance.primary ?? 0);
        break;
      case "ranged":
        freeStrike.range.ranged = signature.system.distance.primary ?? 0;
        break;
      case "meleeRanged":
        freeStrike.range.melee = Math.max(1, signature.system.distance.primary ?? 0);
        freeStrike.range.ranged = Math.max(5, signature.system.distance.secondary ?? 0);
        break;
    }

    return freeStrike;
  }

  /* -------------------------------------------------- */

  /**
   * Create a chat message with the damage roll from this companion.
   * @returns {Promise<void>}
   */
  async performFreeStrike() {
    const freeStrike = this.freeStrike;

    const title = _loc("DRAW_STEEL.Actor.npc.FreeStrike.DialogTitle");

    const roll = new DamageRoll(String(freeStrike.value), {
      type: freeStrike.type,
      flavor: ds.CONFIG.damageTypes[freeStrike.type]?.label,
    });

    await roll.evaluate();

    await DrawSteelChatMessage.create({
      title,
      speaker: DrawSteelChatMessage.getSpeaker({ actor: this.parent }),
      type: "standard",
      "system.parts": [{
        rolls: [roll],
        flavor: title,
        type: "roll",
      }],
      flags: { core: { canPopout: true } },
    });
  }
}
