import BaseSpecialEffect from "./base-special-effect.mjs";
import { systemPath } from "../../../constants.mjs";

const { BooleanField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Some abilities have a “Spend X [Heroic Resource]” entry in the body of the ability. These grant additional effects
 * to an ability, where X is the amount of your Heroic Resource you must spend to activate those effects. If an entry
 * reads “Spend X+ [Heroic Resource],” you can spend as much of your available Heroic Resource as you like in multiples
 * of X to increase the effect’s impact, as described in the entry’s details.
 */
export default class SpendSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "spend";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      resource: new SchemaField({
        value: new NumberField({ integer: true, initial: 1, positive: true, nullable: false, required: true }),
        multiple: new BooleanField(),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get detailsPartial() {
    return systemPath("templates/sheets/pseudo-documents/special-effect/spend.hbs");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get label() {
    return _loc(`DRAW_STEEL.SPECIAL_EFFECT.spend.${this.resource.multiple ? "multiple" : "single"}`,
      { value: this.resource.value, resourceName: this.parent.resourceName },
    );
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async getSheetContext(options) {
    return {
      resourceName: this.parent.resourceName,
    };
  }
}
