import BaseSpecialEffect from "./base-special-effect.mjs";
import { systemPath } from "../../../constants.mjs";

/**
 * @import { DrawSteelActiveEffect, DrawSteelActor } from "../../../documents/_module.mjs";
 */

const { NumberField } = foundry.data.fields;

/**
 * Persistent effects are used by the Elementalist.
 */
export default class PersistentSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "persistent";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      essence: new NumberField({ integer: true, initial: 1, positive: true, nullable: false, required: true }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get detailsPartial() {
    return systemPath("templates/sheets/pseudo-documents/special-effect/persistent.hbs");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get label() {
    return _loc("DRAW_STEEL.SPECIAL_EFFECT.persistent", { value: this.essence });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  constructButtons() {
    return [ds.utils.constructHTMLButton({
      label: this.label,
      icon: "fa-solid fa-wand-sparkles",
      dataset: {
        specialEffectId: this.id,
        action: "persistent",
      },
    })];
  }

  /* -------------------------------------------------- */

  /**
   * Creates an active effect that reduces essence gain.
   * @returns {DrawSteelActiveEffect}
   */
  async applyPersist() {
    /** @type {DrawSteelActor} */
    const parent = this.document.actor;
    if (!parent) throw new Error("No parent actor found to create Persistent AE!");

    return foundry.documents.ActiveEffect.create({
      name: this.label,
      img: this.document.img,
      description: "<p>If you take damage equal to our greater than [[lookup 5*@R evaluate]]{5 times your Reason score} in one turn, you stop maintaining any persistent abilities.</p>",
      duration: {
        expiry: "combatEnd",
      },
      origin: foundry.utils.buildRelativeUuid(this.document, parent),
      system: {
        changes: [{
          key: "system.hero.primary.turnGain",
          type: "subtract",
          value: this.essence,
        }],
      },
    }, { parent });
  }
}
