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
  const { config, label: fallback } = match.groups;
  const parsedConfig = parseConfig(config);

  for (const value of parsedConfig.values) {
    if (value in ds.CONFIG.references) parsedConfig.id ??= value;
  }

  const uuid = ds.CONFIG.references[parsedConfig.id];
  if (!uuid) return null;
  const page = await fromUuid(uuid);
  if (!page || (page.type !== "reference")) return null;

  const dataset = {
    referenceId: parsedConfig.id,
    tooltipHtml: CONFIG.ux.TooltipManager.constructHTML({ uuid }),
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
