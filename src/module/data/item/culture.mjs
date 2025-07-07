import AdvancementModel from "./advancement.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      type: "culture",
      invalidActorTypes: ["npc"],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.culture");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async applyAdvancements({ actor, ...config }, { toCreate = {}, ...options } = {}) {
    if (actor.system.culture) throw new Error(`${actor.name} already has a culture!`);

    const keepId = !actor.items.has(this.parent.id);
    const itemData = game.items.fromCompendium(this.parent, { keepId });
    toCreate[this.parent.uuid] = itemData;

    return super.applyAdvancements({ actor, ...config }, { toCreate, ...options });
  }
}
