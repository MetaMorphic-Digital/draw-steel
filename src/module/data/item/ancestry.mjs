import AdvancementModel from "./advancement.mjs";

/**
 * A humanoid creature’s species. Every hero has an ancestry.
 */
export default class AncestryModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "ancestry",
      invalidActorTypes: ["npc", "object"],
    };
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
