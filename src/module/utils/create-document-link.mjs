/**
 * @import { EnrichmentAnchorOptions } from "@client/applications/ux/text-editor.mjs"
 */

/**
 * Create a content link for a document from its uuid.
 * @param {string} uuid The documents UUID. Must be able to resolve synchronously.
 * @param {Partial<EnrichmentAnchorOptions>} [options]  Additional options to configure how the link is constructed.
 * @returns {HTMLAnchorElement} Returns null if no document was found.
 */
export default function createDocumentLink(uuid, { attrs = {}, dataset = {}, classes = [], name, icon } = {}) {
  const entry = fromUuidSync(uuid, { strict: false });
  if (!entry) return null;
  if (entry instanceof foundry.abstract.Document) return entry.toAnchor({ attrs, dataset, classes, name, icon });

  const parseInfo = foundry.utils.parseUuid(uuid);

  // Build dataset
  const documentConfig = CONFIG[parseInfo.documentType];
  const documentName = _loc(`DOCUMENT.${parseInfo.documentType}`);
  let anchorIcon = icon ?? documentConfig.sidebarIcon;
  if (!classes.includes("content-link")) classes.unshift("content-link");
  attrs = foundry.utils.mergeObject({ draggable: "true" }, attrs);
  dataset = foundry.utils.mergeObject({
    uuid,
    link: "",
    id: parseInfo.id,
    type: parseInfo.documentType,
    pack: parseInfo.collection?.collection,
    tooltip: documentName,
  }, dataset);

  // If this is a typed document, add the type to the dataset
  if (entry.type) {
    const typeLabel = documentConfig.typeLabels[entry.type];
    const typeName = game.i18n.has(typeLabel) ? _loc(typeLabel) : "";
    attrs["aria-label"] ??= typeName
      ? _loc("DOCUMENT.TypePageFormat", { type: typeName, page: documentName })
      : documentName;
    dataset.tooltip = "";
    anchorIcon = icon ?? documentConfig.typeIcons?.[entry.type] ?? documentConfig.sidebarIcon;
  }

  name ??= entry.name;
  return CONFIG.ux.TextEditor.createAnchor({ attrs, dataset, name, classes, icon: anchorIcon });
}
