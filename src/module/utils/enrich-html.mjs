/** @import {EnrichmentOptions} from "@client/applications/ux/text-editor.mjs" */

/**
 * Helper function that reduces path length for enrichment calls and improves default handling.
 * Enrich HTML content by replacing or augmenting components of it
 * @param {string} content                  The original HTML content (as a string)
 * @param {EnrichmentOptions} [options={}]  Additional options which configure how HTML is enriched
 * @returns {Promise<string>}               The enriched HTML content
 */
export default async function enrichHTML(content, options = {}) {
  // Override document-related options with the relative document's info
  if (options.relativeTo) {
    // allow secrets=false to prevent secret display
    options.secrets &&= options.relativeTo.isOwner;
    if (options.relativeTo.getRollData instanceof Function) options.rollData = options.relativeTo.getRollData();
  }
  return foundry.applications.ux.TextEditor.implementation.enrichHTML(content, options);
}
