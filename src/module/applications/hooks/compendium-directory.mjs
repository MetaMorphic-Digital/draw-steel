import DrawSteelCompendiumBrowser from "../apps/compendium-browser.mjs";

/**
 * @import { ApplicationRenderOptions } from "@client/applications/_types.mjs";
 * @import CompendiumDirectory from "@client/applications/sidebar/tabs/compendium-directory.mjs";
 */

/**
 * A hook event that fires when the CompendiumDirectory application is rendered.
 * @param {CompendiumDirectory} app         The Application instance being rendered.
 * @param {HTMLElement} html  The inner HTML of the document that will be displayed and may be modified.
 * @param {Record<string, any>} context The object of data used when rendering the application.
 * @param {ApplicationRenderOptions} options
 */
export function renderCompendiumDirectory(app, html, context, options) {
  const headerActions = html.querySelector("header .header-actions");
  headerActions.insertAdjacentElement("beforeend", ds.utils.constructHTMLButton({
    label: _loc("DRAW_STEEL.COMPENDIUM.BROWSER.title"),
    icon: DrawSteelCompendiumBrowser.DEFAULT_OPTIONS.window.icon,
    dataset: {
      action: "openCompendiumBrowser",
    },
  }));

  app.options.actions.openCompendiumBrowser ??= openCompendiumBrowser;
}

/* -------------------------------------------------- */

/**
 * Open the compendium browser.
 * @this CompendiumDirectory
 * @param {PointerEvent} event    The initiating click event.
 * @param {HTMLElement} target    The capturing element that defined the [data-action].
 */
async function openCompendiumBrowser(event, target) {
  new DrawSteelCompendiumBrowser().render({ force: true });
}
