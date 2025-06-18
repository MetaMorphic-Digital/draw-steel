/** @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs" */
/** @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs" */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.damage";

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = /\[\[\/damage[^\]]+\]\]/g;

/** @type {TextEditorEnricher} */
export function enricher(match, options) {
  const link = document.createElement("a");
  link.innerText = match[0];
  return link;
}

/**
 * Called when the enriched content is added to the DOM
 * @param {HTMLEnrichedContentElement} element
 */
export function onRender(element) {
  console.log(element);
}
