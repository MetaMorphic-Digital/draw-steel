import DrawSteelActorSheet from "./actor-sheet.mjs";
import RetainerMetadataInput from "../apps/retainer-metadata-input.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * An implementation of an actor sheet for Retainer actors.
 */
export default class DrawSteelRetainerSheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["retainer"],
    actions: {
      spendRecovery: this.#spendRecovery,
      editRetainerMetadata: this.#editRetainerMetadata,
    },
    position: {
      // Immunities and Weaknesses section is visible by default
      height: 650,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/retainer-sheet/header.hbs"),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/sheets/actor/retainer-sheet/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/sheets/actor/retainer-sheet/features.hbs"),
      templates: ["templates/sheets/actor/shared/partials/features/features.hbs"].map(t => systemPath(t)),
      scrollable: [""],
    },
    abilities: {
      template: systemPath("templates/sheets/actor/shared/abilities.hbs"),
      scrollable: [""],
    },
    effects: {
      template: systemPath("templates/sheets/actor/shared/effects.hbs"),
      scrollable: [""],
    },
    biography: {
      template: systemPath("templates/sheets/actor/retainer-sheet/biography.hbs"),
      templates: ["languages.hbs", "biography.hbs", "director-notes.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
        context.retainerKeywords = this._getRetainerKeywords();
        context.mentorLink = this.document.system.retainer.mentor?.toAnchor();
        break;
      case "stats":
        context.characteristics = this._getCharacteristics(true);
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the printable string for the retainer's keywords.
   * @returns {string[]}
   */
  _getRetainerKeywords() {
    const monsterKeywords = ds.CONFIG.monsters.keywords;
    return Array.from(this.actor.system.retainer.keywords).map(k => monsterKeywords[k]?.label).filter(k => k);
  }

  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the retainer's stamina and reducing the number of recoveries.
   * @this RetainerSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #spendRecovery(event, target) {
    await this.actor.system.spendRecovery();
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit the retainer metadata.
   * @this DrawSteelNPCSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editRetainerMetadata(event, target) {
    new RetainerMetadataInput({ document: this.document }).render({ force: true });
  }
}
