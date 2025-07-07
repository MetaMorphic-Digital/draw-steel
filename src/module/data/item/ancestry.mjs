import AdvancementModel from "./advancement.mjs";

/**
 * Ancestries describe how a hero was born and grant benefits from their anatomy and physiology
 */
export default class AncestryModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "ancestry",
      invalidActorTypes: ["npc"],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.ancestry");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async applyAdvancements({ actor, ...config }, { toCreate = {}, ...options } = {}) {
    if (actor.system.ancestry) throw new Error(`${actor.name} already has an ancestry!`);

    const keepId = !actor.items.has(this.parent.id);
    const itemData = game.items.fromCompendium(this.parent, { keepId });
    toCreate[this.parent.uuid] = itemData;

    return super.applyAdvancements({ actor, ...config }, { toCreate, ...options });
  }
}
