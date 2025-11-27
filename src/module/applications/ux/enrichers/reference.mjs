import { createLink, parseConfig } from "../helpers.mjs";

/**
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.reference";

/* -------------------------------------------------- */

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = /\[\[reference (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export async function enricher(match, options) {
  let { config, label: fallback } = match.groups;
  config = parseConfig(config);

  if (!("id" in config)) {
    const id = config.values.find(k => k in ds.CONFIG.references);
    if (!id) return null;
    config.id = id;
  }

  const uuid = ds.CONFIG.references[config.id];
  const page = await fromUuid(uuid);
  if (!page || (page.type !== "reference")) return null;

  const dataset = {
    referenceId: config.id,
    tooltipHtml: game.tooltip.constructor.constructHTML({ uuid }),
  };
  const label = fallback?.trim() || page.name;
  return createLink(label, dataset);
}

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM.
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {}
