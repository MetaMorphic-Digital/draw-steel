import { systemID, systemPath } from "../../constants.mjs";

/** @import TokenHUD from "@client/applications/hud/token-hud.mjs" */
/** @import { ApplicationRenderOptions } from "@client/applications/_types.mjs" */
/** @import DrawSteelTokenDocument from "../../documents/token.mjs"; */

/**
 * A hook event that fires when the TokenHUD application is rendered
 * @param {TokenHUD} app
 * @param {HTMLElement} html
 * @param {object} context
 * @param {ApplicationRenderOptions} options
 */
export async function renderTokenHUD(app, html, context, options) {
  // We don't have to add in a separate set of listeners if we leverage the actions
  if (!("changeMovement" in app.options.actions)) Object.assign(app.options.actions, { toggleMovementTray, changeMovement, shifting });

  /** @type {DrawSteelTokenDocument} */
  const tokenDocument = app.document;

  const movementType = tokenDocument.movementType;

  const movement = ds.CONFIG.movementTypes;

  const movementModes = Object.entries(movement).map(([type, { label, icon }]) => {
    const active = movementType === type ? "active" : "";
    return { type, label, icon, active };
  });

  const tokenMovement = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/token-movement.hbs"), {
    movementModes,
    movementTray: app._movementTrayActive ? "active" : "",
    currentMovement: movement[movementType],
    shifting: tokenDocument.isShifting ? "active" : "",
  });

  html.insertAdjacentHTML("afterbegin", tokenMovement);
}

/**
 * Change the currently active movement mode
 * @this TokenHUD
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 */
function changeMovement(event, target) {
  const newType = target.dataset.type;
  /** @type {DrawSteelTokenDocument} */
  const tokenDocument = this.document;
  tokenDocument.setFlag(systemID, "movementType", newType);
}

/**
 * Open the movement tray
 * @this TokenHUD
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 */
function toggleMovementTray(event, target) {
  let active = !this._movementTrayActive;
  this._movementTrayActive = active;
  const button = this.element.querySelector(".control-icon[data-action=toggleMovementTray]");
  button.classList.toggle("active", active);
  const palette = this.element.querySelector(".movement-modes");
  palette.classList.toggle("active", active);
  canvas.app.view.focus(); // Return focus to the canvas so keyboard movement is honored
}

/**
 * Toggle shifting status
 * @this TokenHUD
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 */
function shifting(event, target) {
  /** @type {DrawSteelTokenDocument} */
  const tokenDocument = this.document;
  const isShifting = !tokenDocument.isShifting;
  tokenDocument.setFlag(systemID, "shifting", isShifting);
}
