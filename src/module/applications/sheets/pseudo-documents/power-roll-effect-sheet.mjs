import { systemPath } from "../../../constants.mjs";
import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

export default class PowerRollEffectSheet extends PseudoDocumentSheet {
  /** @inheritdoc */
  static TABS = {
    ...super.TABS,
    tiers: {
      tabs: [{ id: "tier1" }, { id: "tier2" }, { id: "tier3" } ],
      initial: "tier1",
      labelPrefix: "DRAW_STEEL.PSEUDO.SHEET.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/identity.hbs"),
      classes: ["tab"],
    },
    details: {
      template: systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/details.hbs"),
      templates: [
        "templates/generic/tab-navigation.hbs",
        systemPath("templates/sheets/pseudo-documents/power-roll-effect-sheet/details-tiers.hbs"),
      ],
      classes: ["tab"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {
      tabs: this._prepareTabs("primary"),
      tabTiers: this._prepareTabs("tiers"),
      pseudo: this.pseudoDocument,
      document: this.document,
      fields: {
        tier1: {},
        tier2: {},
        tier3: {},
      },
    };

    // TODO: add placeholder equal to the "default" text this effect would display
    context.fields.text = this._prepareField("text");

    switch (context.pseudo.type) {
      case "damage":
        await this.#prepareDamageFields(context);
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare fields specific to the `damage` effect.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {Promise<void>}   A promise that resolves once the context has been mutated.
   */
  async #prepareDamageFields(context) {
    context.fields.text.placeholder = "{{damage}}";
    for (const n of [1, 2, 3]) {
      context.fields[`tier${n}`].damage = {
        value: Object.assign(this._prepareField(`damage.tier${n}.value`), {
          placeholder: (n === 1)
            ? "1"
            : (n === 2)
              ? 2 * context.fields.tier1.damage.value.value
              : 3 * context.fields.tier1.damage.value.value,
        }),
        types: this._prepareField(`damage.tier${n}.types`),
      };
    }
    context.fields.damageTypes = Object.entries(ds.CONFIG.damageTypes).map(([k, v]) => ({ value: k, label: v.label }));
  }
}
