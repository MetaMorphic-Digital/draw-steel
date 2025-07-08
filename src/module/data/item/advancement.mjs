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

  /* -------------------------------------------------- */

  /**
   * Helper method to add an item's advancements and create or update this item.
   * @param {object} [options]                  Optional properties to configure this advancement's creation
   * @param {DrawSteelActor} [options.actor]    The actor to create this item within
   * @param {object} [options.levels]           Level info for this advancement
   * @param {number} [options.levels.start=1]   Base level for this advancement
   * @param {number} [options.levels.end=1]     End level for this advancement
   * @param {object} [options.toCreate]         Record of original items' uuids to the to-be-created item data (may have `_id` if allowed).
   * @param {object} [options.toUpdate]         Record of existing items' ids to the updates to be performed.
   * @param {object} [options.actorUpdate]      Record of actor data to update with the advancement
   */
  async applyAdvancements({ actor = this.actor, levels = { start: 1, end: 1 }, toCreate = {}, toUpdate = {}, actorUpdate = {} } = {}) {
    if (!actor) throw new Error("An item without a parent must provide an actor to be created within");
    const { start: levelStart = 1, end: levelEnd = 1 } = levels;

    if (!(this.parent.uuid in toCreate)) {
      if (!this.actor) {
        const keepId = !actor.items.has(this.parent.id);
        const itemData = game.items.fromCompendium(this.parent, { keepId, clearFolder: true });
        toCreate[this.parent.uuid] = itemData;
      } else if (!(this.parent.id in toUpdate)) toUpdate[this.parent.id] = { _id: this.parent.id };
    }

    const chains = [];
    for (const advancement of this.advancements) {
      const validRange = advancement.levels.some(level => level.between(levelStart, levelEnd));
      if (validRange) chains.push(await ds.utils.AdvancementChain.create(advancement));
    }

    const title = this.actor ?
      game.i18n.format("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.levelUpTitle", { name: actor.name }) :
      game.i18n.format("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.createWithAdvancementsTitle", { name: this.parent.name });

    const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chains, actor, window: { title },
    });
    if (!configured) return;

    // TODO: store id of the "parent" item to allow for later recursive deletion.

    // First gather all new items that are to be created.
    for (const chain of chains) for (const node of chain.active()) {
      if (node.advancement.type !== "itemGrant") continue;

      for (const uuid of node.chosenSelection) {
        const item = node.choices[uuid].item;
        const keepId = !actor.items.has(item.id) && !(item.id in toCreate);
        const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
        toCreate[item.uuid] = itemData;
      }
    }

    // Perform item data modifications or store item updates.
    for (const chain of chains) for (const node of chain.active()) {
      if (!node.advancement.isTrait) continue;
      const item = node.advancement.document;
      const isExisting = item.parent === actor;
      let itemData;

      if (isExisting) {
        toUpdate[item.id] ??= { _id: item.id };
        itemData = toUpdate[item.id];
      } else {
        itemData = toCreate[item.uuid];
      }

      foundry.utils.setProperty(itemData, `flags.${systemID}.advancement.${node.advancement.id}.selected`, node.chosenSelection);
    }

    const transactions = await Promise.all([
      actor.createEmbeddedDocuments("Item", Object.values(toCreate), { ds: { levels } }),
      actor.updateEmbeddedDocuments("Item", Object.values(toUpdate), { ds: { levels } }),
      actor.update(actorUpdate, { ds: { levels } }),
    ]);

    return transactions[0].find(i => i.type === this.parent.type);
  }
}
