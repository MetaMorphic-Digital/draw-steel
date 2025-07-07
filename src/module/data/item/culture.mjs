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
  async applyAdvancements({ actor, ...options }) {
    if (!this.actor && actor.system.culture) throw new Error(`${actor.name} already has a culture!`);

    return super.applyAdvancements({ actor, ...options });
  }
}
