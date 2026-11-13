import ActorChoiceAdvancement from "./actor-choice-advancement.mjs";

/**
 * @import { ActorChoice } from "./_types";
 * @import { CompanionSummon } from "../../actor/_types";
 * @import HeroModel from "../../actor/hero.mjs";
 * @import { DrawSteelActor, DrawSteelTokenDocument } from "../../../documents/_module.mjs";
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

    /** @type {Omit<DrawSteelActor, "system"> & { system: HeroModel }} */
    const hero = this.document.actor;
    if (!hero) return;

    const flags = this.document.getFlag(ds.CONST.systemID, "advancement") ?? {};
    hero.system._companionAdvancements.push({ uuid: flags[this.id]?.selected.at(0), skills: flags[this.id]?.skills ?? [], advancementUuid: this.uuid });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async configureAdvancement(node = null) {
    const updateData = await super.configureAdvancement(node);
    if (updateData) {
      const expansion = foundry.utils.expandObject(updateData);
      const flagData = foundry.utils.getProperty(expansion, `flags.draw-steel.advancement.${this.id}`);
      flagData.skills = [];
      const promises = [];
      for (const uuid of flagData.selected) promises.push(fromUuid(uuid));
      const documents = await Promise.all(promises);
      for (const companion of documents) flagData.skills.push(...companion.system.companion.skills);
      if (node) node.skills = expansion.skills;
      return expansion;
    }
    return updateData;
  }

  /* -------------------------------------------------- */

  /**
   * Summons a hero's companion, adding in appropriate items.
   * @param {DrawSteelActor} hero
   * @returns {DrawSteelTokenDocument} The summoned companion, or null if none were placed.
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

    const tokens = await ds.utils.performSummon(companionUuid, hero, { items: companionAbilities });

    if (tokens?.length) {
      const token = tokens.at(0);
      await token.baseActor.update({ "system.companion.master": hero.id });
      return token;
    } else return null;
  }
}
