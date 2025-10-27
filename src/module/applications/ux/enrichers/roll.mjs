import DrawSteelChatMessage from "../../../documents/chat-message.mjs";
import { DSRoll, DamageRoll } from "../../../rolls/_module.mjs";
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
 * Valid roll types.
 */
const rollTypes = ["damage", "heal", "healing", "gain", "heroic", "surge"];

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp(`\\[\\[/(?<type>${rollTypes.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi");

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export function enricher(match, options) {
  let { type, config, label } = match.groups;
  /** @type {typeof rollTypes} */
  type = type.toLowerCase();
  const parsedConfig = parseConfig(config, { multiple: true });
  parsedConfig._input = match[0];

  switch (type) {
    case "heal":
    case "healing": parsedConfig._isHealing = true; // eslint-ignore no-fallthrough
    case "damage": return enrichDamageHeal(parsedConfig, label, options);
    case "gain": return enrichGain(parsedConfig, label, options);
    case "heroic":
      //[[/heroic 2]] -> [[/gain 2 heroic]]
      parsedConfig[0].values.push("heroic");
      return enrichGain(parsedConfig, label, options);
    case "surge":
      //[[/surge 2]] -> [[/gain 2 surge]]
      parsedConfig[0].values.push("surge");
      return enrichGain(parsedConfig, label, options);
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

/**
 * Gain Enricher.
 */

/**
 * Enrich a gain link for heroic resources.
 * @param {ParsedConfig[]} parsedConfig      Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the enricher could be built, otherwise null.
 */
function enrichGain(parsedConfig, label, options) {
  const linkConfig = { type: "gain", formula: null, gainType: null };

  // Parse the formula and type from configuration
  for (const c of parsedConfig) {
    const formulaParts = [];
    if (c.formula) formulaParts.push(c.formula);
    c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
    for (const value of c.values) {
      const normalizedValue = value.toLowerCase();
      if (["hr", "heroic", "surge"].includes(normalizedValue)) {
        c.type.push(normalizedValue);
      } else {
        formulaParts.push(value);
      }
    }
    c.formula = DSRoll.replaceFormulaData(
      formulaParts.join(" "),
      options.rollData ?? options.relativeTo?.getRollData?.() ?? {},
    );
    if (c.formula) {
      linkConfig.formula = c.formula;
      linkConfig.gainType = c.type[0]; // Require type to be specified
      break; // Only use first formula
    }
  }

  if (!linkConfig.formula || !linkConfig.gainType) return null;

  if (label) {
    return createLink(label,
      linkConfig,
      { classes: "roll-link", icon: "fa-bolt" },
    );
  }

  let resourceType;

  switch (linkConfig.gainType) {
    case "hr": // eslint-ignore no-fallthrough
    case "heroic":
      resourceType = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");
      break;
    case "surge":
      resourceType = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.surges.label");
      break;
  }
  const localizationData = {
    formula: createLink(linkConfig.formula, {}, { tag: "span", icon: "fa-bolt" }).outerHTML,
    type: resourceType,
  };

  const link = document.createElement("a");
  link.className = "roll-link";
  addDataset(link, linkConfig);
  link.innerHTML = game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.Gain.FormatString", localizationData);

  return link;
}

/* -------------------------------------------------- */

/**
 * Helper function that constructs the gain roll for heroic resources.
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

  let resourceLabel;

  switch (gainType) {
    case "surge":
      resourceLabel = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.surges.label");
      break;
    case "hr": // eslint-ignore no-fallthrough
    case "heroic":
      resourceLabel = game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");
      break;
  }

  let targetList;

  const multipleActors = (actors.size > 1);
  if (multipleActors) {
    const names = [...actors].map((a) => DrawSteelChatMessage.getSpeaker({ actor: a }).alias);
    const formatter = game.i18n.getListFormatter({ type: "unit" });
    const combinedNames = formatter.format(names);
    targetList = `(${combinedNames})`;
  }

  // Create the chat message
  await DrawSteelChatMessage.create({
    rolls: [roll],
    flavor: game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.Gain.MessageTitle", { type: resourceLabel, targets: targetList ?? "" }),
    flags: { core: { canPopout: true } },
    speaker: DrawSteelChatMessage.getSpeaker(),
    style: multipleActors ? CONST.CHAT_MESSAGE_STYLES.OOC : CONST.CHAT_MESSAGE_STYLES.DEFAULT,
  });

  // Apply the gain to each selected token's actor
  for (const actor of actors) {
    switch (gainType) {
      case "surge":
        await actor.modifyTokenAttribute("hero.surges", roll.total, true, false);
        break;
      case "heroic":
        await actor.modifyTokenAttribute("hero.primary.value", roll.total, true, false);
        break;
      default:
        return;
    }
  }
}
