import {systemPath} from "../constants.mjs";

/**
 * Preload templates for use in the system
 */
export async function registerDrawSteelPartials() {
  const templates = ["templates/item/embeds/ability.hbs"];
  return loadTemplates(templates.map(t => systemPath(t)));
}
