import { systemPath } from "../../../constants.mjs";
import PseudoDocumentSheet from "../../api/pseudo-document-sheet.mjs";

/**
 * @import BasePowerRollEffect from "../../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";
 */

/**
 *
 * @extends PseudoDocumentSheet<BasePowerRollEffect>
 */
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
        name: {
          field: this.pseudoDocument.schema.getField("name"),
          src: this.pseudoDocument._source.name,
          name: "name",
          placeholder: this.pseudoDocument.typeLabel,
        },
        tier1: {},
        tier2: {},
        tier3: {},
      },
    };

    await context.pseudo._tierRenderingContext?.(context);

    return context;
  }

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.pseudoDocument.onRender(this.element);
  }
}
