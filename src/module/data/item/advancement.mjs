import { systemID } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";

/**
 * @import DrawSteelActor from "../../documents/actor.mjs";
 */

export default class AdvancementModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "",
      embedded: {
        Advancement: "system.advancements",
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      advancements: new ds.data.fields.CollectionField(ds.data.pseudoDocuments.advancements.BaseAdvancement),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.advancement");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    if ((this.actor?.type !== "character")) return;

    const record = this.actor.system._traits;
    const flags = this.parent.flags[systemID]?.advancement ?? {};
    const addTrait = (type, trait) => {
      record[type] ??= new Set();
      for (const k of trait) record[type].add(k);
    };
    const level = this.actor.system.level;
    for (const advancement of this.advancements) {
      if (!advancement.isTrait) continue;
      if (!advancement.levels.some(l => l <= level)) continue;
      const selected = advancement.isChoice
        ? flags[advancement.id]?.selected ?? []
        : advancement.traitOptions.map(option => option.value);
      addTrait(advancement.type, selected);
    }
  }

  /**
   * Helper method to create an item's advancements
   * @param {object} config                 Mandatory Properties
   * @param {DrawSteelActor} config.actor   The actor to create this item within
   * @param {number} config.levelStart      Base level of advancements to include
   * @param {number} config.levelEnd        Highest level of advancements to include
   * @param {object} [options]              Optional properties to configure this advancement's creation
   * @param {object} [options.toCreate]     Record of original items' uuids to the to-be-created item data (may have `_id` if allowed).
   * @param {object} [options.toUpdate]     Record of existing items' ids to the updates to be performed.
   * @param {object} [options.actorUpdate]  Record of actor data to update with the advancement
   */
  async applyAdvancements({ actor, levelStart, levelEnd }, { toCreate = {}, toUpdate = {}, actorUpdate = {} } = {}) {
    const chains = [];
    for (const advancement of this.advancements) {
      const validRange = advancement.levels.some(level => level.between(levelStart, levelEnd));
      if (validRange) chains.push(await ds.utils.AdvancementChain.create(advancement));
    }

    const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chains, actor,
    });
    if (!configured) return;

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
      actor.createEmbeddedDocuments("Item", Object.values(toCreate), { ds: { advancement: [levelStart, levelEnd] } }),
      actor.updateEmbeddedDocuments("Item", Object.values(toUpdate), { ds: { advancement: [levelStart, levelEnd] } }),
      actor.update(actorUpdate, { ds: { advancement: [levelStart, levelEnd] } }),
    ]);
  }
}
