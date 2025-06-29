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
    const pseudo = this.pseudoDocument;
    const context = {
      pseudo,
      tabs: this._prepareTabs("primary"),
      tabTiers: this._prepareTabs("tiers"),
      document: this.document,
      fields: {
        name: {
          field: pseudo.schema.getField("name"),
          src: pseudo._source.name,
          name: "name",
          placeholder: game.i18n.localize(`TYPES.PowerRollEffect.${pseudo.type}`),
        },
        tier1: {},
        tier2: {},
        tier3: {},
      },
    };

    await context.pseudo._tierRenderingContext?.(context);

    return context;
  }
}
