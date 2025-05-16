import { systemPath } from "../constants.mjs";

/** @import {HotReloadData} from "@client/types.mjs" */

/**
 * A hook event that fires when a package that is being watched by the hot reload system has a file changed.
 * The hook provides the hot reload data related to the file change.
 * Hooked functions may intercept the hot reload and prevent the core software from handling it by returning false.
 *
 * @param {HotReloadData} data          The hot reload data
 */
export function hotReload(data) {
  if (data.packageType !== "system") return;
  // Possible need to update this if we add other languages into the base system
  if (data.path === systemPath("lang/en.json")) {
    // Hook is called *before* i18n is updated so need to wait for that to resolve
    // Can be removed if https://github.com/foundryvtt/foundryvtt/issues/11762 is implemented
    queueMicrotask(() => {
      // Repeat the i18n process from Localization.#localizeDataModels
      for (const documentName of CONST.ALL_DOCUMENT_TYPES) {
        for (const model of Object.values(CONFIG[documentName].dataModels ?? {})) {
          foundry.helpers.Localization.localizeDataModel(model, { prefixPath: "system." });
        }
      }
      // Render all apps again.
      for (const appV1 of Object.values(ui.windows)) appV1.render();
      for (const appV2 of foundry.applications.instances.values()) appV2.render();
    });
  }
  else if (data.path.includes(systemPath("src/styles"))) {
    let path = systemPath("css/draw-steel-");
    if (data.path.includes("styles/elements")) path += "elements.css";
    else if (data.path.includes("styles/system")) path += "system.css";
    else if (data.path.includes("styles/variables")) path += "variables.css";

    // Taken from core's `Game##hotReloadCSS`
    const pathRegex = new RegExp(`@import "${path}(?:\\?[^"]+)?"`);
    for (const style of document.querySelectorAll("style")) {
      const [match] = style.textContent.match(pathRegex) ?? [];
      if (match) {
        style.textContent = style.textContent.replace(match, `@import "${path}?${Date.now()}"`);
        return;
      }
    }
  }
}
