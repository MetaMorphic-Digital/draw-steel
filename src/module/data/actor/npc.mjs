import { systemID } from "../../constants.mjs";
import { requiredInteger, setOptions } from "../helpers.mjs";
import BaseActorModel from "./base.mjs";
import SourceModel from "../models/source.mjs";

/** @import DrawSteelItem from "../../documents/item.mjs"; */
/** @import AbilityModel from "../item/ability.mjs"; */
/** @import { MaliceModel } from "../settings/_module.mjs"; */

/**
 * NPCs are created and controlled by the director
 */
export default class NPCModel extends BaseActorModel {
  /** @inheritdoc */
  static metadata = Object.freeze({
    type: "npc",
  });

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "DRAW_STEEL.Source",
    "DRAW_STEEL.Actor.base",
    "DRAW_STEEL.Actor.NPC",
  ];

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.source = new fields.EmbeddedDataField(SourceModel);

    schema.negotiation = new fields.SchemaField({
      interest: requiredInteger({ initial: 5 }),
      patience: requiredInteger({ initial: 5 }),
      motivations: new fields.SetField(setOptions()),
      pitfalls: new fields.SetField(setOptions()),
      impression: requiredInteger({ initial: 1 }),
    });

    schema.monster = new fields.SchemaField({
      freeStrike: requiredInteger({ initial: 0 }),
      keywords: new fields.SetField(setOptions()),
      level: requiredInteger({ initial: 1 }),
      ev: requiredInteger({ initial: 4 }),
      role: new fields.StringField({ required: true }),
      organization: new fields.StringField({ required: true }),
    });

    return schema;
  }

  /** @inheritdoc */
  get level() {
    return this.monster.level;
  }

  /** @inheritdoc */
  get isMinion() {
    return foundry.utils.getProperty(this, "monster.organization") === "minion";
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.source.prepareData(this.parent._stats?.compendiumSource ?? this.parent.uuid);
  }

  /** @inheritdoc */
  get coreResource() {
    return {
      name: game.i18n.localize("DRAW_STEEL.Setting.Malice.Label"),
      /** @type {MaliceModel} */
      target: game.settings.get(systemID, "malice"),
      path: "value",
    };
  }

  /**
   * Fetch the traits of this creature's free strike.
   * The value is stored in `this.monster.freeStrike`
   * @returns {{
   *   value: number;
   *   keywords: Set<string>;
   *   type: string;
   *   range: {
   *     melee: number;
   *     ranged: number;
   *   };
   * }}
   */
  get freeStrike() {
    /** @type {DrawSteelItem & {system: AbilityModel}} */
    const signature = this.parent.items.find(i => (i.type === "ability") && (i.system.category === "signature"));
    /** @type {Set<string>} */
    const keywords = signature ? new Set(["magic", "psionic", "weapon"]).intersection(signature.system.keywords) : new Set();
    const freeStrike = {
      value: this.monster.freeStrike,
      keywords: keywords.add("strike"),
      type: signature?.system.powerRoll.tier1.damage.type ?? "",
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

  /** @inheritdoc */
  async updateResource(delta) {
    if (!game.user.isGM) throw new Error("Malice can only be updated by a GM");
    /** @type {MaliceModel} */
    const malice = game.settings.get(systemID, "malice");
    await game.settings.set(systemID, "malice", { value: malice.value + delta });
  }
}

/** @typedef {ReturnType<NPCModel["freeStrike"]>} FreeStrike */
