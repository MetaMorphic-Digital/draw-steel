import { systemID, systemPath } from "../../constants.mjs";

/** @import DrawSteelTokenDocument from "../../documents/token.mjs"; */

/**
 * An extension of the core TokenHUD that adds movement-related controls.
 */
export default class DrawSteelTokenHUD extends foundry.applications.hud.TokenHUD {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      changeMovement: this.#changeMovement,
      toggleMovementTray: { handler: this.#toggleMovementTray, buttons: [0, 2] },
      shifting: this.#shifting,
    },
  };

  /**
   * Track whether the movement tray is currently expanded or hidden
   * @type {boolean}
   */
  #movementTrayActive = false;

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _onRender(context, options) {
    await super._onRender(context, options);

    /** @type {DrawSteelTokenDocument} */
    const tokenDocument = this.document;

    const movementType = tokenDocument.movementType;

    const movement = ds.CONFIG.movementTypes;

    const movementModes = Object.entries(movement).map(([type, { label, icon }]) => {
      const active = movementType === type ? "active" : "";
      return { type, label, icon, active };
    });

    const tokenMovement = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/token-movement.hbs"), {
      movementModes,
      movementTray: this.#movementTrayActive ? "active" : "",
      currentMovement: movement[movementType],
      shifting: tokenDocument.isShifting ? "active" : "",
    });

    this.element.insertAdjacentHTML("afterbegin", tokenMovement);
  }

  /* -------------------------------------------- */
  /*  Public API                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  bind(object) {
    // Movement tray should always be closed when switching between tokens
    this.#movementTrayActive = false;
    return super.bind(object);
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Change the currently active movement mode
   * @this DrawSteelTokenHUD
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #changeMovement(event, target) {
    const newType = target.dataset.type;
    /** @type {DrawSteelTokenDocument} */
    const tokenDocument = this.document;
    tokenDocument.setFlag(systemID, "movementType", newType);
  }

  /**
   * Open the movement tray on left click, reset to walk on right
   * @this DrawSteelTokenHUD
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #toggleMovementTray(event, target) {
    if (event.button === 0) {
      const active = !this.#movementTrayActive;
      this.#movementTrayActive = active;
      const button = this.element.querySelector(".control-icon[data-action=toggleMovementTray]");
      button.classList.toggle("active", active);
      const palette = this.element.querySelector(".movement-modes");
      palette.classList.toggle("active", active);
      canvas.app.view.focus(); // Return focus to the canvas so keyboard movement is honored
    }
    else this.document.setFlag(systemID, "movementType", CONFIG.Token.movement.defaultAction);
  }

  /**
   * Toggle shifting status
   * @this DrawSteelTokenHUD
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #shifting(event, target) {
    /** @type {DrawSteelTokenDocument} */
    const tokenDocument = this.document;
    const isShifting = !tokenDocument.isShifting;
    tokenDocument.setFlag(systemID, "shifting", isShifting);
  }
}
