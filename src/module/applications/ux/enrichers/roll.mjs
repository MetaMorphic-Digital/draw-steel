/** @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs" */
/** @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs" */

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
  console.log(match, config, parsedConfig, options);
  switch (type) {
    case "heal":
    case "healing": config._isHealing = true; // eslint-ignore no-fallthrough
    case "damage": return enrichDamage(parsedConfig, label, options);
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
 * Enrich a damage link.
 * @param {object[]} configs           Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the enricher could be built, otherwise null.
 *
 */
function enrichDamage(parsedConfig, label, options) {
  const config = { type: "damage", formulas: [], damageTypes: [], rollType: configs._isHealing ? "healing" : "damage" };
  const link = document.createElement("a");
  link.innerText = label;
  for (const c of configs) {
    const formulaParts = [];
    if (c.formula) formulaParts.push(c.formula);
    c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
    for (const value of c.values) {
      if (value in ds.CONFIG.damageTypes) c.type.push(value);
      else if (value in CONFIG.DND5E.healingTypes) c.type.push(value);
      else if (value === "temp") c.type.push("temphp");
      else formulaParts.push(value);
    }
    c.formula = Roll.defaultImplementation.replaceFormulaData(
      formulaParts.join(" "),
      options.rollData ?? options.relativeTo?.getRollData?.() ?? {},
    );
    if (configs._isHealing && !c.type.length) c.type.push("healing");
    if (c.formula) {
      config.formulas.push(c.formula);
      config.damageTypes.push(c.type.join("|"));
    }
  }
  config.damageTypes = config.damageTypes.map(t => t?.replace("/", "|"));
  console.log(config, parsedConfig, label, options);
  return link;
}

/**
 * Called when the enriched content is added to the DOM
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  console.log(element);
}
