import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
import { DSRoll, DamageRoll, PowerRoll } from "../../../rolls/_module.mjs";
import DSDialog from "../../api/dialog.mjs";
import { parseConfig, createLink, addDataset } from "../helpers.mjs";

/**
 * @import { ParsedConfig } from "../helpers.mjs";
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 */

/**
 * Implementation logic for all roll-style enrichers.
 * Inspired by the implementation in dnd5e.
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.roll";

/* -------------------------------------------------- */

/**
 * Resource name to localization key and attribute path mappings for gain enricher.
 * Maps resource type identifiers to their i18n localization keys and actor attribute paths.
 *
 * @typedef {string} label - The full i18n path used to label the resource
 * @typedef {string} resource - The full path, relative to the actor, used to update the resource
 * @typedef {string} resourceFormatString - Final key in the i18n path used for localization, relative to DRAW_STEEL.EDITOR.Enrichers.Gain.{MessageTitle|FormatString} (Default: "Default")
 */
const GAIN_RESOURCE_LOOKUP = {
  epic: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.epic.value.label",
    resource: "hero.epic.value",
  },
  heroic: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label",
    resource: "hero.primary.value",
  },
  renown: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.renown.label",
    resource: "hero.renown",
  },
  surge: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.surges.label",
    resource: "hero.surges",
  },
  victory: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.victories.label",
    resource: "hero.victories",
    resourceFormatString: "Victory",
  },
  wealth: {
    label: "DRAW_STEEL.Actor.hero.FIELDS.hero.wealth.label",
    resource: "hero.wealth",
  },
};

/**
 * Valid roll types.
 */
const multiRollTypes = ["damage", "heal", "healing"];

/**
 * Valid roll types that only allow a single formula.
 */
const singleRollTypes = Object.keys(GAIN_RESOURCE_LOOKUP).concat(["gain", "test"]);

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp(`\\[\\[/(?<type>${multiRollTypes.concat(singleRollTypes).join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi");

/* -------------------------------------------------- */

const GAIN_RESOURCE_ALIASES = {
  hr: "heroic",
  victories: "victory",
  surges: "surge",
};

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export function enricher(match, options) {
  let { type, config, label } = match.groups;
  /** @type {typeof multiRollTypes} */
  type = type.toLowerCase();
  const parsedConfig = parseConfig(config, { multiple: multiRollTypes.includes(type) });
  parsedConfig._input = match[0];

  if (type in GAIN_RESOURCE_LOOKUP) {
    parsedConfig.type = type;
    type = "gain";
  }

  switch (type) {
    case "heal":
    case "healing": parsedConfig._isHealing = true; // eslint-ignore no-fallthrough
    case "damage": return enrichDamageHeal(parsedConfig, label, options);
    case "gain": return enrichGain(parsedConfig, label, options);
    case "test": return enrichTest(parsedConfig, label, options);
  }
}

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM.
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  const link = element.querySelector("a");

  link.addEventListener("click", (ev) => {
    switch (link.dataset.type) {
      case "damageHeal":
        return void rollDamageHeal(link, ev);
      case "gain":
        return void rollGain(link, ev);
      case "test":
        return void rollTest(link, ev);
    }
  });
}

/* -------------------------------------------------- */

/**
 * Damage/Heal Enricher.
 */

/**
 * Enrich a damage link.
 * @param {ParsedConfig[]} parsedConfig      Configuration data.
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
    return createLink(label,
      { ...linkConfig, formulas, damageTypes },
      { classes: "roll-link-group roll-link", icon: "fa-dice-d10" },
    );
  }

  const parts = [];
  for (const [idx, formula] of linkConfig.formulas.entries()) {
    const type = linkConfig.damageTypes[idx];
    const types = type?.split("|")
      .map(t => ds.CONFIG.damageTypes[t]?.label ?? ds.CONFIG.healingTypes[t]?.label)
      .filter(_ => _);
    const localizationData = {
      formula: createLink(formula, {}, { tag: "span", icon: "fa-dice-d10" }).outerHTML,
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(types),
    };

    parts.push(game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.DamageHeal.FormatString", localizationData));
  }

  const link = document.createElement("a");
  link.className = "roll-link-group";
  addDataset(link, { ...linkConfig, formulas, damageTypes });

  link.innerHTML = game.i18n.getListFormatter().format(parts);

  return link;
}

/* -------------------------------------------------- */

/**
 * Helper function that constructs the damage roll.
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
/*   Gain Enricher                                    */
/* -------------------------------------------------- */

/**
 * Enrich a gain link for resources.
 * @param {ParsedConfig} parsedConfig      Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the enricher could be built, otherwise null.
 */
function enrichGain(parsedConfig, label, options) {
  const linkConfig = { type: "gain", formula: null, gainType: parsedConfig.type };

  // Parse the formula and type from configuration
  const formulaParts = [];
  if (parsedConfig.formula) formulaParts.push(parsedConfig.formula);
  for (const value of parsedConfig.values) {
    const normalizedValue = value.toLowerCase();
    // If the normalized value is present in the lookup object, add it to the config type
    if (normalizedValue in GAIN_RESOURCE_LOOKUP) {
      linkConfig.gainType = normalizedValue;
    } else if (normalizedValue in GAIN_RESOURCE_ALIASES) {
      linkConfig.gainType = GAIN_RESOURCE_ALIASES[normalizedValue];
    } else {
      formulaParts.push(value);
    }
  }

  linkConfig.formula = DSRoll.replaceFormulaData(
    formulaParts.join(" "),
    options.rollData ?? options.relativeTo?.getRollData?.() ?? {},
  );

  if (!linkConfig.formula || !(linkConfig.gainType in GAIN_RESOURCE_LOOKUP)) return null;

  if (label) {
    return createLink(label,
      linkConfig,
      { classes: "roll-link", icon: "fa-bolt" },
    );
  }

  const lookup = GAIN_RESOURCE_LOOKUP[linkConfig.gainType];
  const resourceType = game.i18n.localize(lookup.label);

  const localizationData = {
    formula: createLink(linkConfig.formula, {}, { tag: "span", icon: "fa-bolt" }).outerHTML,
    type: resourceType,
  };

  const resourceFormatString = lookup.resourceFormatString ?? "Default";

  const link = document.createElement("a");
  link.className = "roll-link";
  addDataset(link, linkConfig);
  link.innerHTML = game.i18n.format(`DRAW_STEEL.EDITOR.Enrichers.Gain.FormatString.${resourceFormatString}`, localizationData);

  return link;
}

/* -------------------------------------------------- */

/**
 * Helper function that constructs the gain roll for resources.
 * @param {HTMLAnchorElement} link
 * @param {PointerEvent} event
 */
async function rollGain(link, event) {
  const { formula, gainType } = link.dataset;

  if (!formula) throw new Error("Gain link must have a formula");
  if (!gainType) throw new Error("Gain link must have a gain type");

  // Get all selected hero tokens
  const actors = ds.utils.tokensToActors().filter((a) => a.type === "hero");

  if (!actors.size) {
    ui.notifications.warn(game.i18n.localize("DRAW_STEEL.EDITOR.Enrichers.Gain.NoSelection"));
    return;
  }

  // Roll the formula
  const roll = new DSRoll(formula);
  await roll.evaluate();

  let targetList;

  const multipleActors = (actors.size > 1);
  if (multipleActors) {
    const names = [...actors].map((a) => DrawSteelChatMessage.getSpeaker({ actor: a }).alias);
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const combinedNames = formatter.format(names);
    targetList = `(${combinedNames})`;
  }

  const lookup = GAIN_RESOURCE_LOOKUP[gainType];
  const resourceFormatString = lookup.resourceFormatString ?? "Default";

  // Get the localized resource label
  const resourceLabel = game.i18n.localize(lookup.label);

  // Create the chat message
  await DrawSteelChatMessage.create({
    rolls: [roll],
    flavor: game.i18n.format(`DRAW_STEEL.EDITOR.Enrichers.Gain.MessageTitle.${resourceFormatString}`, { type: resourceLabel, targets: targetList ?? "" }),
    flags: { core: { canPopout: true } },
    speaker: DrawSteelChatMessage.getSpeaker(),
    style: multipleActors ? CONST.CHAT_MESSAGE_STYLES.OOC : CONST.CHAT_MESSAGE_STYLES.DEFAULT,
  });

  // Apply the gain to each selected token's actor
  for (const actor of actors) {
    await actor.modifyTokenAttribute(lookup.resource, roll.total, true, false);
  }
}

/* -------------------------------------------------- */
/*   Test Enricher                                    */
/* -------------------------------------------------- */

/**
 * Enrich a test link.
 * @param {ParsedConfig} parsedConfig      Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the enricher could be built, otherwise null.
 */
function enrichTest(parsedConfig, label, options) {
  const linkConfig = {
    type: "test",
    characteristic: parsedConfig.characteristic,
    difficulty: parsedConfig.difficulty,
    edges: parsedConfig.edges,
    banes: parsedConfig.banes,
  };

  const letterCharacteristics = {
    M: "might",
    A: "agility",
    R: "reason",
    I: "intuition",
    P: "presence",
  };

  for (const value of parsedConfig.values) {
    const normalizedValue = value.toLowerCase();
    if (value in ds.CONFIG.characteristics) linkConfig.characteristic ??= normalizedValue;
    if (letterCharacteristics[value]) linkConfig.characteristic ??= letterCharacteristics[value];
    if (normalizedValue in ds.CONST.testOutcomes) linkConfig.difficulty ??= normalizedValue;
  }

  if (!linkConfig.characteristic) return null;

  const localizationData = {
    difficulty: game.i18n.localize(ds.CONST.testOutcomes[linkConfig.difficulty]?.label) ?? "",
    characteristic: ds.CONFIG.characteristics[linkConfig.characteristic].label,
  };

  label ??= game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.Test.FormatString.Default", localizationData);

  return createLink(label,
    linkConfig,
    { icon: "fa-dice-d10" },
  );
}

/* -------------------------------------------------- */

/**
 * Helper function that constructs the test roll.
 * @param {HTMLAnchorElement} link
 * @param {PointerEvent} event
 */
async function rollTest(link, event) {
  const { characteristic, difficulty, edges, banes } = link.dataset;

  if (!characteristic) throw new Error("Test enricher must provide a characteristic");

  for (const actor of ds.utils.tokensToActors()) {
    if (typeof actor.system.rollCharacteristic === "function") actor.system.rollCharacteristic(characteristic, { difficulty, edges, banes });
  }
}
