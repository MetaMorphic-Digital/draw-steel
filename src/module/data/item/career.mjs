import { systemPath } from "../../constants.mjs";
import AdvancementModel from "./advancement.mjs";

/**
 * @import CharacterModel from "../actor/character.mjs";
 */

/**
 * Careers describe what a hero did for a living before becoming a hero
 */
export default class CareerModel extends AdvancementModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: "career",
      invalidActorTypes: ["npc"],
      detailsPartial: [systemPath("templates/sheets/item/partials/career.hbs")],
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat("DRAW_STEEL.Item.career");

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.projectPoints = new fields.NumberField({ integer: true, required: true });
    schema.renown = new fields.NumberField({ integer: true, required: true });
    schema.wealth = new fields.NumberField({ integer: true, required: true });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    if ((userId !== game.userId) || !this.actor) return;

    /** @type {CharacterModel} */
    const systemModel = this.actor.system;

    this.actor.update({
      system: {
        hero: {
          wealth: systemModel.hero.wealth + this.wealth,
          renown: systemModel.hero.renown + this.renown,
        },
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if ((userId !== game.userId) || !this.actor) return;

    /** @type {CharacterModel} */
    const systemModel = this.actor.system;

    this.actor.update({
      system: {
        hero: {
          wealth: systemModel.hero.wealth - this.wealth,
          renown: systemModel.hero.renown - this.renown,
        },
      },
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async applyAdvancements({ actor, ...options }) {
    if (!this.actor && actor.system.career) throw new Error(`${actor.name} already has a career!`);

    return super.applyAdvancements({ actor, ...options });
  }
}
