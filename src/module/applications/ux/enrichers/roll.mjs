/** @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs" */
/** @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs" */

import { DSRoll } from "../../../rolls/_module.mjs";

/**
 * Implementation logic for all roll-style enrichers.
 * Inspired by the implementation in dnd5e
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.roll";

/**
 * Valid roll types
 */
const rollTypes = ["damage", "heal", "healing"];

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp(`\\[\\[/(?<type>${rollTypes.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi");

/** @type {TextEditorEnricher} */
export function enricher(match, options) {
  let { type, config, label } = match.groups;
  /** @type {typeof rollTypes} */
  type = type.toLowerCase();
  const parsedConfig = parseConfig(config, { multiple: ["damage", "heal", "healing"].includes(type) });
  parsedConfig._input = match[0];

  switch (type) {
    case "heal":
    case "healing": parsedConfig._isHealing = true; // eslint-ignore no-fallthrough
    case "damage": return enrichDamageHeal(parsedConfig, label, options);
  }
}

/**
 * Parse a roll string into a configuration object.
 * @param {string} match  Matched configuration string.
 * @param {object} [options={}]
 * @param {boolean} [options.multiple=false]  Support splitting configuration by "&" into multiple sub-configurations.
 *                                            If set to `true` then an array of configs will be returned.
 * @returns {object|object[]}
 */
function parseConfig(match = "", { multiple = false } = {}) {
  if (multiple) return match.split("&").map(s => parseConfig(s));
  const config = { _config: match, values: [] };
  for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
    if (!part) continue;
    const [key, value] = part.split("=");
    const valueLower = value?.toLowerCase();
    if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
    else if (["true", "false"].includes(valueLower)) config[key] = valueLower === "true";
    else if (Number.isNumeric(value)) config[key] = Number(value);
    else config[key] = value.replace(/(^"|"$)/g, "");
  }
  return config;
}

/**
 * Called when the enriched content is added to the DOM
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  element.querySelector("a").addEventListener("click", rollDamageHeal);
}

/**
 * Damage Enricher
 */

/**
 * Enrich a damage link.
 * @param {object[]} parsedConfig      Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the enricher could be built, otherwise null.
 *
 */
function enrichDamageHeal(parsedConfig, label, options) {
  const linkConfig = { type: "damage", formulas: [], damageTypes: [], rollType: parsedConfig._isHealing ? "healing" : "damage" };

  console.log(parsedConfig)

  for (const c of parsedConfig) {
    const formulaParts = [];
    if (c.formula) formulaParts.push(c.formula);
    c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
    for (const value of c.values) {
      if (value in ds.CONFIG.damageTypes) c.type.push(value);
      else if (value in ds.CONFIG.healingTypes) c.type.push(value);
      else if (["heal", "healing"].includes(value)) c.type.push("value");
      else if (["temp", "temphp"].includes(value)) c.type.push("temporary");
      else formulaParts.push(value);
    }
    c.formula = DSRoll.replaceFormulaData(
      formulaParts.join(" "),
      options.rollData ?? options.relativeTo?.getRollData?.() ?? {},
    );
    if (parsedConfig._isHealing && !c.type.length) c.type.push("value");
    if (c.formula) {
      linkConfig.formulas.push(c.formula);
      linkConfig.damageTypes.push(c.type.join("|"));
    }
  }

  linkConfig.damageTypes = linkConfig.damageTypes.map(t => t?.replace("/", "|"));

  const formulas = linkConfig.formulas.join("&");
  const damageTypes = linkConfig.damageTypes.join("&");

  if (!linkConfig.formulas.length) return null;

  if (!linkConfig.formulas.length) return null;
  if (label) {
    return createRollLink(label, { ...linkConfig, formulas, damageTypes }, { classes: "roll-link-group roll-link" });
  }

  const parts = [];
  for (const [idx, formula] of linkConfig.formulas.entries()) {
    const type = linkConfig.damageTypes[idx];
    const types = type?.split("|")
      .map(t => ds.CONFIG.damageTypes[t]?.label ?? ds.CONFIG.healingTypes[t]?.label)
      .filter(_ => _);
    const localizationData = {
      formula: createRollLink(formula, {}, { tag: "span" }).outerHTML,
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(types),
    };

    parts.push(game.i18n.format("DRAW_STEEL.EDITOR.DamageHeal", localizationData));
  }

  const link = document.createElement("a");
  link.className = "roll-link-group";
  _addDataset(link, { ...linkConfig, formulas, damageTypes });

  link.innerHTML = game.i18n.getListFormatter().format(parts);

  return link;
}

/**
 * @this {HTMLAnchorElement}
 * @param {PointerEvent} event
 */
function rollDamageHeal(event) {
  console.log(this, event);
  const { type, formulas, rollType, damageTypes } = this.dataset;
}

/*************************************
 *
 * HTML CONSTRUCTION HELPER FUNCTIONS
 *
 *************************************/

/**
 * Create a rollable link.
 * @param {string} label                           Label to display.
 * @param {object} [dataset={}]                    Data that will be added to the link for the rolling method.
 * @param {object} [options={}]
 * @param {boolean} [options.classes="roll-link"]  Class to add to the link.
 * @param {string} [options.tag="a"]               Tag to use for the main link.
 * @returns {HTMLElement}
 */
function createRollLink(label, dataset = {}, { classes = "roll-link", tag = "a" } = {}) {
  const link = document.createElement(tag);
  link.className = classes;
  link.insertAdjacentHTML("afterbegin", "<i class=\"fa-solid fa-dice-d10\" inert></i>");
  link.append(label);
  _addDataset(link, dataset);
  return link;
}

/**
 * Add a dataset object to the provided element.
 * @param {HTMLElement} element  Element to modify.
 * @param {object} dataset       Data properties to add.
 * @private
 */
function _addDataset(element, dataset) {
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith("_") && (key !== "values") && value) element.dataset[key] = value;
  }
}
