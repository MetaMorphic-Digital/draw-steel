import { systemPath } from "../../constants.mjs";
import DrawSteelActorSheet from "./actor-sheet.mjs";
import { DocumentSourceInput, ObjectMetadataInput } from "../apps/_module.mjs";

export default class DrawSteelObjectSheet extends DrawSteelActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["object"],
    actions: {
      updateSource: this.#updateSource,
      editObjectMetadata: this.#editObjectMetadata,
    },
    window: {
      controls: [{
        icon: "fa-solid fa-file-arrow-down",
        label: "DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Label",
        action: "updateFromCompendium",
        visible: DrawSteelObjectSheet.#canUpdateFromCompendium,
      }],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/actor/object-sheet/header.hbs"),
      templates: ["templates/sheets/actor/object-sheet/header.hbs"].map(t => systemPath(t)),
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    stats: {
      template: systemPath("templates/sheets/actor/object-sheet/stats.hbs"),
      templates: ["characteristics.hbs", "combat.hbs", "movement.hbs", "immunities-weaknesses.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/stats/${t}`)),
      scrollable: [""],
    },
    features: {
      template: systemPath("templates/sheets/actor/object-sheet/features.hbs"),
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
      template: systemPath("templates/sheets/actor/object-sheet/biography.hbs"),
      templates: ["languages.hbs", "biography.hbs", "director-notes.hbs"].map(t => systemPath(`templates/sheets/actor/shared/partials/biography/${t}`)),
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getMovement() {
    const data = super._getMovement();

    data.show = !!this.actor.system.movement.value;

    return data;
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Whether this npc can be updated from a compendium source.
   *
   * @this DrawSteelObjectSheet
   */
  static #canUpdateFromCompendium() {
    const sourceDoc = !!fromUuidSync(this.document._stats.compendiumSource, { strict: false });
    return sourceDoc && game.user.canUpdateFromCompendium();
  }

  /* -------------------------------------------------- */

  /**
   * Open the update source dialog.
   * @this DrawSteelObjectSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #updateSource(event, target) {
    new DocumentSourceInput({ document: this.document }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * Open a dialog to edit the object metadata.
   * @this DrawSteelObjectSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   */
  static async #editObjectMetadata(event, target) {
    new ObjectMetadataInput({ document: this.document }).render({ force: true });
  }
}
