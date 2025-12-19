export default class DrawSteelCompendiumTOC extends foundry.applications.sidebar.apps.Compendium {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "table-of-contents"],
    actions: {
      configureTOC: this.#configureTOC,
    },
    window: {
      controls: [
        {
          action: "configureTOC",
          icon: "fa-solid fa-edit",
          label: "DRAW_STEEL.COMPENDIUM.TOC.configure",
          visible: this.#canConfigureTOC,
        },
      ],
    },
  };

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Helper function to replace the application class of Journal compendiums with a TOC view.
   */
  static applyToPacks() {
    for (const pack of game.packs.filter(p => p.metadata.type === "JournalEntry")) {
      pack.applicationClass = this;
      // if (pack.metadata.flags.display === "table-of-contents") pack.applicationClass = this;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Include "Configure TOC" in the window controls.
   * @this DrawSteelCompendiumTOC
   */
  static #canConfigureTOC() {
    return !this.collection.locked && this.collection.testUserPermission(game.user, "OWNER");
  }

  /* -------------------------------------------------- */

  /**
   * Configure the display of the journals within this application.
   *
   * @this DrawSteelCompendiumTOC
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #configureTOC(event, target) {
    console.log(this, event, target);
  }
}
