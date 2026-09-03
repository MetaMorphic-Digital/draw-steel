import { CompanionMetadataInput, DocumentSourceInput } from "../apps/_module.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";
import { systemPath } from "../../constants.mjs";

/**
 * An implementation of an actor sheet for Companion actors.
 */
export default class DrawSteelCompanionSheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["companion"],
    actions: {
      updateSource: this.#updateSource,
      spendRecovery: this.#spendRecovery,
      editCompanionMetadata: this.#editCompanionMetadata,
      freeStrike: this.#freeStrike,
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
      template: systemPath("templates/sheets/actor/companion-sheet/header.hbs"),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/sheets/actor/companion-sheet/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/sheets/actor/companion-sheet/features.hbs"),
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
      template: systemPath("templates/sheets/actor/companion-sheet/biography.hbs"),
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
        context.companionKeywords = this._getCompanionKeywords();
        context.masterLink = this.document.system.companion.master?.toAnchor();
        break;
      case "stats":
        context.characteristics = this.actor.system._getCharacteristics(this.isEditMode);
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the printable string for the companion's keywords.
   * @returns {string[]}
   */
  _getCompanionKeywords() {
    const monsterKeywords = ds.CONFIG.monsters.keywords;
    return Array.from(this.actor.system.companion.keywords).map(k => monsterKeywords[k]?.label).filter(k => k);
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Spend a recovery, adding to the companion's stamina and reducing the number of recoveries.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #spendRecovery(event, target) {
    await this.actor.system.spendRecovery();
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit the companion metadata.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editCompanionMetadata(event, target) {
    this.renderChild(new CompanionMetadataInput({ document: this.document }));
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #updateSource(event, target) {
    this.renderChild(new DocumentSourceInput({ document: this.document }));
  }

  /* -------------------------------------------------- */

  /**
   * Perform a free strike.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #freeStrike(event, target) {
    this.actor.system.performFreeStrike();
  }

  /* -------------------------------------------------- */
  /*   Drag and Drop                                    */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    // Sort & Permission check first
    if (!this.isEditable) return null;
    if (this.actor.uuid === item.parent?.uuid) {
      const result = await this._onSortItem(event, item);
      return result?.length ? item : null;
    }

    if (item.type === "class") {
      const cls = this.actor.system.class;
      if (cls) {
        const deleted = await cls.deleteDialog();
        if (!deleted) {
          const message = _loc("DRAW_STEEL.ADVANCEMENT.WARNING.cannotAddNewType", {
            type: _loc(CONFIG.Item.typeLabels[item.type]),
          });
          ui.notifications.error(message, { console: false });
          throw new Error(message);
        }
      }
    }

    const keepId = !this.actor.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId, clearFolder: true });
    const result = await getDocumentClass("Item").create(itemData, { parent: this.actor, keepId });
    return result ?? null;
  }
}
