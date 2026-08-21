import { requiredInteger, setOptions } from "../helpers.mjs";
import CreatureModel from "./creature.mjs";
import DamageRoll from "../../rolls/damage.mjs";
import DrawSteelChatMessage from "../../documents/chat-message.mjs";
import SourceModel from "../models/source.mjs";

/**
 * @import DrawSteelItem from "../../documents/item.mjs";
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

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.companion = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      role: new fields.StringField({ required: true }),
      master: new fields.ForeignDocumentField(foundry.documents.Actor),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData();

    // TODO: Shared companion stats include
    // - stamina
    // - skills
    // - perks/titles/conditions (conditional on "logical")
    // - surges

    // Winded is set in the base classes derived data, so this needs to run after
    this.stamina.min = -this.stamina.winded;

    const roles = ds.CONFIG.monsters.roles;
    this.companion.roleLabel = roles[this.companion.role]?.label ?? "";

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
   * Spend a recovery, adding to the companion's stamina and reducing the number of recoveries.
   * @returns {Promise<DrawSteelActor>}
   */
  async spendRecovery() {
    const master = this.companion.master;

    if (!master) {
      ui.notifications.error("DRAW_STEEL.Actor.companion.NoMaster", { format: { companion: this.parent.name } });
      return this.parent;
    }

    const recoveryInfo = master.system.recoveries;

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

    // CONSIDER: Companions nominally don't have ranged free strikes, maybe remove data?

    const freeStrike = {
      value: this.companion.freeStrike,
      keywords: keywords.add("strike"),
      type: firstDamage?.damage.tier1.types.first() ?? "",
      range: {
        melee: 1,
        ranged: 5,
      },
    };
    switch (signature?.system.distance.type) {
      case "melee":
        freeStrike.range.melee = Math.max(1, signature.system.distance.primary ?? 0);
        break;
      case "ranged":
        freeStrike.range.ranged = Math.max(5, signature.system.distance.primary ?? 0);
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
