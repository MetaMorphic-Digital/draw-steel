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
  async applyAdvancements({ actor, ...options }) {
    if (!this.actor && actor.system.ancestry) throw new Error(`${actor.name} already has an ancestry!`);

    return super.applyAdvancements({ actor, ...options });
  }
}
