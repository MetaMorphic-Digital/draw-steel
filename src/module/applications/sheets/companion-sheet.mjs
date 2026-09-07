import { CharacteristicInput, CompanionMetadataInput, DocumentSourceInput } from "../apps/_module.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";
import HeroModel from "../../data/actor/hero.mjs";
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
      editCharacteristics: this.#editCharacteristics,
      editCompanionMetadata: this.#editCompanionMetadata,
      levelUp: this.#levelUp,
      openAdvancements: this.#openAdvancements,
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
        context.masterLink = this.actor.system.companion.master?.toAnchor();
        context.recoveryFields = HeroModel.schema.getField("recoveries").fields;
        context.heroFields = HeroModel.schema.getField("hero").fields;
        context.recoveries = this.actor.system.recoveries;
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

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Every render rather than first render because master status can change.
    const master = this.actor.system.companion.master;
    if (master) master.apps[this.id] ??= this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onClose(context, options) {
    super._onClose(context, options);
    const master = this.actor.system.companion.master;
    if (master) delete master.apps[this.id];
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
   * Open a configuration app to edit this hero's characteristics.
   * @this DrawSteelHeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editCharacteristics(event, target) {
    this.renderChild(new CharacteristicInput({ document: this.document }));
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit the companion metadata.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editCompanionMetadata(event, target) {
    this.renderChild(new CompanionMetadataInput({ document: this.actor }));
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #updateSource(event, target) {
    this.renderChild(new DocumentSourceInput({ document: this.actor }));
  }

  /* -------------------------------------------------- */

  /**
   * Advance this companion one level.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #levelUp(event, target) {
    await this.actor.system.advance();
  }

  /* -------------------------------------------------- */

  /**
   * Open the companion's class sheet or prompt its creation.
   * @this DrawSteelCompanionSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #openAdvancements(event, target) {
    const cls = this.actor.system.class;
    if (cls) await cls.sheet.render({ force: true });
    else await this.actor.system.fillClass();
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
