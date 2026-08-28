import DocumentInput from "../api/document-input.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * Helper sheet for minion stats.
 */
export default class MinionStatsInput extends DocumentInput {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["minion-stats"],
    window: {
      title: "DRAW_STEEL.Actor.npc.MinionStats.DialogTitle",
      icon: "fa-solid fa-scroll",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/apps/minion-stats/stats.hbs"),
    },
    immunities: {
      template: systemPath("templates/apps/minion-stats/immunities.hbs"),
    },
    weaknesses: {
      template: systemPath("templates/apps/minion-stats/weaknesses.hbs"),
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "stats" },
        { id: "immunities" },
        { id: "weaknesses" },
      ],
      initial: "stats",
      labelPrefix: "DRAW_STEEL.Actor.Tabs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "stats":
        context.characteristics = this.document.system._getCharacteristics(true);
        context.movement = this.document.system._getMovement();
        context.effects = this.document.effects.filter(e => !e.transfer).map(e => ({ label: e.name, value: e.id }));
        context.monsterFields = this.document.system.schema.getField("monster").fields;
        break;
      case "immunities":
      case "weaknesses":
        context.damageIW = this.document.system._getImmunitiesWeaknesses();
        break;
    }

    return context;
  }
}
