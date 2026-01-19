
import BasePowerRollEffect from "../../../data/pseudo-documents/power-roll-effects/base-power-roll-effect.mjs";
import { parseConfig } from "../helpers.mjs";

/**
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 * @import { ParsedConfig } from "../helpers.mjs";
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.potency";

/* -------------------------------------------------- */

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp("\\[\\[(?<type>potency)(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?", "gi");

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export async function enricher(match, options) {
  let { config, label: fallback } = match.groups;

  /** @type {ParsedConfig} */
  const parsedConfig = parseConfig(config);
  parsedConfig._input = match[0];

  const characteristics = ds.CONFIG.characteristics;
  const rollKeys = new Set(Object.values(characteristics).map(c => c.rollKey.toLowerCase()));
  const potencyStrengths = new Set(["weak", "average", "strong"]);

  for (const val of parsedConfig.values) {
    const normalizedValue = val.toLowerCase();
    if (rollKeys.has(normalizedValue)) parsedConfig.characteristic ??= normalizedValue;
    else if (characteristics[normalizedValue]?.rollKey) parsedConfig.characteristic ??= characteristics[normalizedValue].rollKey.toLowerCase();
    else if (potencyStrengths.has(normalizedValue)) parsedConfig.strength ??= normalizedValue;
    else if (Number.isNumeric(val)) parsedConfig.strength = Number(val);
  }

  // Convert characteristic strings to characteristic roll keys.
  if (parsedConfig.characteristic in characteristics) parsedConfig.characteristic = characteristics[parsedConfig.characteristic].rollKey.toLowerCase();

  const hasValidCharacteristic = rollKeys.has(parsedConfig.characteristic);
  const hasValidStrength = parsedConfig.strength && ((typeof parsedConfig.strength === "number") || potencyStrengths.has(parsedConfig.strength));
  if (!hasValidCharacteristic || !hasValidStrength) {
    if (!hasValidCharacteristic) console.warn(`Potency characteristic must be defined and be a valid characteristic roll key to enrich ${config._input}.`);
    if (!hasValidStrength) console.warn(`Potency strength must be defined and be a number or a valid potency strength to enrich ${config._input}.`);
    return null;
  }

  // Convert strength strings to actor potency values.
  const data = options.rollData ?? options.relativeTo?.getRollData?.() ?? {};
  if (potencyStrengths.has(parsedConfig.strength) && ("potency" in data)) {
    parsedConfig.strength = data.potency[parsedConfig.strength];
  }

  return BasePowerRollEffect.constructPotencyHTML(parsedConfig.characteristic, parsedConfig.strength);
}

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM.
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {}
