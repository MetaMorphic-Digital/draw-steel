import AdvancementModel from "./advancement.mjs";

/**
 * Culture describes the community that raised a hero
 */
export default class CultureModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "culture",
      invalidActorTypes: ["npc"],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.culture");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    if (!this.advancements.size) {
      const lang = {
        type: "language",
        chooseN: 1,
        name: game.i18n.localize("DRAW_STEEL.Item.culture.AnyLanguageAdvancement.name"),
        description: `<p>${game.i18n.localize("DRAW_STEEL.Item.culture.AnyLanguageAdvancement.description")}</p>`,
        requirements: {
          level: 1,
        },
        _id: "anyLang".padEnd(16, "0"),
      };
      this.parent.updateSource({ [`system.advancements.${lang._id}`]: lang });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async applyAdvancements({ actor, ...options }) {
    if (!this.actor && actor.system.culture) throw new Error(`${actor.name} already has a culture!`);

    return super.applyAdvancements({ actor, ...options });
  }
}
