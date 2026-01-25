import { systemPath } from "../../../constants.mjs";

/**
 * An application responsible for displaying a journal entry page with type "tierOutcome".
 */
export default class TierOutcomePage extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "tierOutcome"],
    window: {
      icon: "fa-solid fa-dice-d10",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "tier1" },
        { id: "tier2" },
        { id: "tier3" },
      ],
      initial: "tier1",
      labelPrefix: "DRAW_STEEL.JournalEntryPage.Tabs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static VIEW_PARTS = {
    content: {
      template: systemPath("templates/embeds/journal-entry-page/tier-outcome.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    tier1: {
      template: systemPath("templates/sheets/journal/pages/tier-outcome/tier-input.hbs"),
    },
    tier2: {
      template: systemPath("templates/sheets/journal/pages/tier-outcome/tier-input.hbs"),
    },
    tier3: {
      template: systemPath("templates/sheets/journal/pages/tier-outcome/tier-input.hbs"),
    },
    footer: super.EDIT_PARTS.footer,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "tier1":
      case "tier2":
      case "tier3":
        context.tab = context.tabs[partId];
        context.tier = {
          value: this.document.system[partId],
          name: `system.${partId}`,
        };
        break;
    }

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContentContext(context, options) {
    context.tier1 = await this.document.system.powerRollText(1);
    context.tier2 = await this.document.system.powerRollText(2);
    context.tier3 = await this.document.system.powerRollText(3);
  }
}
