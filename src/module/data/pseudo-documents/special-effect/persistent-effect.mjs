import BaseSpecialEffect from "./base-special-effect.mjs";
import { systemPath } from "../../../constants.mjs";

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
}
