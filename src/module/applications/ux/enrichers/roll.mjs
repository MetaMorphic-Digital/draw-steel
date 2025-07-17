/** @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs" */
/** @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs" */

import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
import { DSRoll, DamageRoll } from "../../../rolls/_module.mjs";
import DSDialog from "../../api/dialog.mjs";

/**
 * Implementation logic for all roll-style enrichers.
 * Inspired by the implementation in dnd5e
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.roll";

/* -------------------------------------------------- */

/**
 * Valid roll types
 */
const rollTypes = ["damage", "heal", "healing"];

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp(`\\[\\[/(?<type>${rollTypes.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi");

/* -------------------------------------------------- */

/**
 * Enricher function
 * @type {TextEditorEnricher}
 */
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

/* -------------------------------------------------- */

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

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  const link = element.querySelector("a");

  link.addEventListener("click", (ev) => {
    switch (link.dataset.type) {
      case "damageHeal":
        return void rollDamageHeal(link, ev);
    }
  });
}

/* -------------------------------------------------- */

/**
 * Damage/Heal Enricher
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
  const linkConfig = { type: "damageHeal", formulas: [], damageTypes: [], rollType: parsedConfig._isHealing ? "healing" : "damage" };

  for (const c of parsedConfig) {
    const formulaParts = [];
    if (c.formula) formulaParts.push(c.formula);
    c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
    for (const value of c.values) {
      const normalizedValue = value.toLowerCase();
      if (normalizedValue in ds.CONFIG.damageTypes) c.type.push(normalizedValue);
      else if (normalizedValue in ds.CONFIG.healingTypes) c.type.push(normalizedValue);
      else if (["heal", "healing"].includes(normalizedValue)) c.type.push("value");
      else if (["temp", "temphp"].includes(normalizedValue)) c.type.push("temporary");
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

    parts.push(game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.DamageHeal.FormatString", localizationData));
  }

  const link = document.createElement("a");
  link.className = "roll-link-group";
  _addDataset(link, { ...linkConfig, formulas, damageTypes });

  link.innerHTML = game.i18n.getListFormatter().format(parts);

  return link;
}

/* -------------------------------------------------- */

/**
 * Helper function that constructs the damage roll
 * @param {HTMLAnchorElement} link
 * @param {PointerEvent} event
 */
async function rollDamageHeal(link, event) {
  let { formulas, rollType, damageTypes } = link.dataset;
  const configKey = rollType === "damage" ? "damageTypes" : "healingTypes";

  if (!["damage", "healing"].includes(rollType)) throw new Error("The button's roll type must be damage or healing");

  const formulaArray = formulas?.split("&") ?? [];
  const damageTypeArray = damageTypes?.split("&") ?? [];

  /** @type {{ index: number; types: string[] }[]} */
  const typeOptions = [];

  const rollPrep = formulaArray.map((formula, idx) => {
    const types = damageTypeArray[idx]?.split("|") ?? [];
    if (types.length > 1) typeOptions.push({
      index: idx,
      types,
    });
    return {
      formula,
      options: { type: types[0], types, isHeal: rollType !== "damage" },
    };
  });

  if (typeOptions.length) {

    const content = typeOptions.reduce((htmlString, choices) => {
      const options = choices.types.map((type) => ({
        value: type,
        label: ds.CONFIG[configKey][type].label,
      }));

      const input = foundry.applications.fields.createSelectInput({
        name: "typeChoice." + choices.index,
        blank: false,
        options,
        value: choices.types[0],
      });

      const label = game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.DamageHeal.ChooseType.InputLabel", { index: choices.index + 1 });

      htmlString += foundry.applications.fields.createFormGroup({ input, label, localize: true }).outerHTML;

      return htmlString;
    }, "");

    const typeChoices = await DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.EDITOR.Enrichers.DamageHeal.ChooseType.DialogTitle",
      },
    });

    if (!typeChoices) return;

    for (const [key, value] of Object.entries(foundry.utils.expandObject(typeChoices).typeChoice)) {
      rollPrep[key].options.type = value;
    }
  }

  const rolls = rollPrep.map(({ formula, options }) => {
    options.flavor = ds.CONFIG[configKey][options.type]?.label;

    return new DamageRoll(formula, {}, options);
  });

  // One by one evaluation to make it easier on users doing manual rolls
  for (const r of rolls) await r.evaluate();

  DrawSteelChatMessage.create({
    rolls,
    flavor: game.i18n.localize("DRAW_STEEL.EDITOR.Enrichers.DamageHeal.MessageTitle." + rollType),
    flags: { core: { canPopout: true } },
  });
}

/* -------------------------------------------------- */

/**
 * HTML Construction Helper Functions
 */

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

/* -------------------------------------------------- */

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
