import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";

/**
 * @import { ActorChoice } from "./_types";
 * @import { CompanionSummon } from "../../actor/_types";
 * @import { DrawSteelActor } from "../../../documents/_module.mjs";
 */

/**
 * An advancement that selects the Beastheart's companion.
 */
export default class CompanionChoiceAdvancement extends ActorChoiceAdvancement {
  /** @inheritdoc */
  static get TYPE() {
    return "companion";
  }

  /* -------------------------------------------------- */

  /**
   * A companion advancement only offers a choice of a single companion.
   * @type {number}
   */
  get chooseN() {
    return 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isChoice() {
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get actorOptions() {
    /** @type {ActorChoice[]} */
    const options = [];
    for (const pack of game.packs) {
      if (pack.documentName !== "Actor") continue;
      for (const idx of pack.index)
        if (idx.type === "companion") options.push({ uuid: idx.uuid });
    }
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const hero = this.document.actor;
    if (!hero) return;

    const flags = this.document.getFlag(ds.CONST.systemID, "advancement") ?? {};
    hero.system._companionAdvancements.push({ uuid: flags[this.id]?.selected.at(0), advancementUuid: this.uuid });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext() {}

  /* -------------------------------------------------- */

  /**
   * Summons a hero's companion, adding in appropriate items.
   * @param {DrawSteelActor} hero
   */
  static async performSummon(hero) {
    const companions = game.actors.filter(a => (a.type === "companion") && (a.system.companion.master === hero));
    /** @type {CompanionSummon[]} */
    const companionAdvancements = hero.system._companionAdvancements;

    let companionUuid;
    // Summon fresh companion
    if (!companions.length) {
      if (!companionAdvancements.length) throw new Error(`${hero.uuid} does not have any companion advancements!`);
      else if (companionAdvancements.length === 1) {
        companionUuid = companionAdvancements.at(0).uuid;
      } else {
        console.error("The Draw Steel System does not support a hero having multiple companions");
        return;
      }
    }
    else if (companions.length === 1) companionUuid = companions.at(0).uuid;
    else {
      console.error("The Draw Steel System does not support a hero having multiple companions");
      return;
    }

    const companionAbilities = hero.itemTypes.ability.filter(i => i.system.keywords.has("companion"));

    return ds.utils.performSummon(companionUuid, hero, { items: companionAbilities });
  }
}
