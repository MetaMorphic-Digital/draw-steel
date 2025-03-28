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
  if (!("changeMovement" in app.options.actions)) app.options.actions.changeMovement = changeMovement;

  /** @type {DrawSteelTokenDocument} */
  const tokenDocument = app.document;
  const movementType = tokenDocument.getFlag(systemID, "movementType") ?? "walk";

  const movement = ds.CONFIG.movementTypes;

  const movementModes = Object.entries(movement).map(([type, { label, icon }]) => {
    const active = movementType === type ? "active" : "";
    return { type, label, icon, active };
  });

  const tokenMovement = await foundry.applications.handlebars.renderTemplate(systemPath("templates/hud/token-movement.hbs"), { movementModes });

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
