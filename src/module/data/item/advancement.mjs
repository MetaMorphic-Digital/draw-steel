import { systemID } from "../../constants.mjs";
import BaseItemModel from "./base.mjs";
import AdvancementChain from "../../utils/advancement/chain.mjs";
import AdvancementNode from "../../utils/advancement/node.mjs";

/**
 * @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs";
 */

export default class AdvancementModel extends BaseItemModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "",
      packOnly: true,
      embedded: {
        Advancement: "system.advancements",
      },
    };
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

    if ((this.actor?.type !== "hero")) return;

    const flags = this.parent.getFlag(systemID, "advancement") ?? {};

    const respiteAdvancements = this.actor.system._respiteAdvancements;

    const record = this.actor.system._traits;
    const unfilled = this.actor.system._unfilledTraits;
    const addTrait = (type, trait) => {
      record[type] ??= new Set();
      for (const k of trait) record[type].add(k);
    };

    const level = this.actor.system.level;
    for (const advancement of this.advancements) {
      if (!advancement.levels.some(l => l <= level)) continue;

      // Populate _respiteAdvancements
      if (advancement.repick.respite) {
        respiteAdvancements[advancement.repick.respite] ??= new Set();
        respiteAdvancements[advancement.repick.respite].add(advancement.getRelativeUUID(this.actor));
      }

      // Populate _unfilledTraits
      if (advancement.isTrait) {
        const selected = advancement.isChoice
          ? flags[advancement.id]?.selected ?? []
          : advancement.traitOptions.map(option => option.value);
        addTrait(advancement.type, selected);
        if (selected.length < advancement.chooseN) {
          unfilled[advancement.type] ??= new Set();
          unfilled[advancement.type].add(advancement.getRelativeUUID(this.actor));
        }
      } else if (advancement.type === "characteristic") {
        for (const chr of flags[advancement.id]?.selected ?? []) {
          const chrInfo = this.actor.system.characteristics[chr];
          chrInfo.value = Math.min(chrInfo.value + 1, advancement.max);
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Helper method to add an item's advancements and create or update this item.
   * @param {object} [options]                  Optional properties to configure this advancement's creation.
   * @param {DrawSteelActor} [options.actor]    The actor to create this item within.
   * @param {object} [options.levels]           Level info for this advancement.
   * @param {number} [options.levels.start=1]   Base level for this advancement.
   * @param {number} [options.levels.end=1]     End level for this advancement.
   * @param {object} [options.toCreate]         Record of original items' uuids to the to-be-created item data.
   *                                            Should always have an `_id` property and allow for item creation
   *                                            with the `keepId: true` option.
   * @param {object} [options.toUpdate]         Record of existing items' ids to the updates to be performed.
   * @param {object} [options.actorUpdate]      Record of actor data to update with the advancement.
   * @param {Map<string, string>} [options._idMap]  Internal map to aid in retrieving 'new' ids of created items.
   * @returns {DrawSteelItem}
   */
  async applyAdvancements({
    actor = this.actor,
    levels = {},
    toCreate = {},
    toUpdate = {},
    actorUpdate = {},
    ...options } = {},
  ) {
    if (!actor) throw new Error("An item without a parent must provide an actor to be created within");
    const _idMap = options._idMap ?? new Map();

    if (!(this.parent.uuid in toCreate)) {
      if (!this.actor) {
        const keepId = !actor.items.has(this.parent.id);
        const itemData = game.items.fromCompendium(this.parent, { keepId, clearFolder: true });
        if (!keepId) itemData._id = foundry.utils.randomID();
        toCreate[this.parent.uuid] = itemData;
        _idMap.set(this.parent.id, itemData._id);
      } else if (!(this.parent.id in toUpdate)) toUpdate[this.parent.id] = { _id: this.parent.id };
    }

    const { start = null, end = 1 } = levels;

    const chain = new AdvancementChain(actor, { start, end });

    await chain.initializeRoots({ item: this.parent });

    const [firstUpdate, ...rest] = Object.values(toUpdate);
    const noUpdates = (Object.keys(firstUpdate ?? {}).length <= 1) && (rest.length === 0);

    if (!chain.nodes.size && foundry.utils.isEmpty(toCreate) && noUpdates) {
      console.debug("No advancements to apply for", this.parent.name);
      return null;
    }

    const title = this.actor ?
      game.i18n.format("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.levelUpTitle", { name: actor.name }) :
      game.i18n.format("DRAW_STEEL.ADVANCEMENT.ChainConfiguration.createWithAdvancementsTitle", { name: this.parent.name });

    const configured = await ds.applications.apps.advancement.ChainConfigurationDialog.create({
      chain, window: { title },
    });
    if (!configured) return;

    const transactions = await actor.system._finalizeAdvancements({ chain, toCreate, toUpdate, actorUpdate, _idMap });

    return transactions[0].find(i => i.type === this.parent.type);
  }
}
