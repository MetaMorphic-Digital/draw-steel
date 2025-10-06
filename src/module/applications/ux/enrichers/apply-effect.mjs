import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
import DSDialog from "../../api/dialog.mjs";
import { createLink, parseConfig } from "../helpers.mjs";

/**
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.apply";

/* -------------------------------------------------- */

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp("\\[\\[/(?<type>apply)(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?", "gi");

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export function enricher(match, options) {
  let { config, label } = match.groups;

  const parsedConfig = parseConfig(config);

  console.log(match, options, parsedConfig);

  return createLink(label || "Applied Effect Enricher", {}, {
    icon: "fa-person-rays",
  });
}

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM.
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  const link = element.querySelector("a");

  link.addEventListener("click", (ev) => {
    console.log(ev);
  });
}
