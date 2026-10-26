import { CompanionChoiceAdvancement, SummonChoiceAdvancement } from "../../../data/pseudo-documents/advancements/_module.mjs";
import { createLink, parseConfig } from "../helpers.mjs";

/**
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 * @import { AnySummonConfig, DirectSummonConfig, PortfolioSummonConfig } from "./_types";
 * @import { ParsedConfig } from "../helpers.mjs";
 * @import { DrawSteelActor } from "../../../documents/_module.mjs";
 */

/** @type {TextEditorEnricherConfig["id"]} */
export const id = "ds.summon";

/* -------------------------------------------------- */

/** @type {TextEditorEnricherConfig["pattern"]} */
export const pattern = new RegExp("\\[\\[/(?<type>summon)(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?", "gi");

/* -------------------------------------------------- */

/**
 * Enricher function.
 * @type {TextEditorEnricher}
 */
export async function enricher(match, options) {
  let { config, label } = match.groups;

  /** @type {ParsedConfig} */
  const parsedConfig = parseConfig(config);
  parsedConfig._input = match[0];

  /** @type {AnySummonConfig} */
  const linkConfig = {
    type: null,
  };

  /** @type {DrawSteelActor} */
  let summoner = fromUuidSync(parsedConfig.summoner, { relative: options.relativeTo });
  switch (options.relativeTo?.documentName) {
    case "Actor":
      summoner ||= options.relativeTo;
      break;
    case "Item":
      summoner ||= options.relativeTo.actor;
      linkConfig.summonItem = options.relativeTo.uuid;
      break;
  }
  if (summoner) linkConfig.summoner = summoner.uuid;

  // Valid types: direct, portfolio
  if (parsedConfig.type) linkConfig.type = parsedConfig.type;
  if (parsedConfig.actor) {
    linkConfig.type = "direct";
    linkConfig.actor = parsedConfig.actor;
  }
  if (parsedConfig.portfolio) {
    // portfolio summons require a summoner
    if (!summoner) return null;
    linkConfig.type = "portfolio";
    linkConfig.portfolio = parsedConfig.portfolio;
    const portfolioItem = summoner.items.find(i => i.dsid === parsedConfig.portfolio);
    linkConfig.summonItem = portfolioItem;
  }
  if (parsedConfig.signatureOnly) linkConfig.signatureOnly = parsedConfig.signatureOnly;
  if (parsedConfig.count) linkConfig.count = parsedConfig.count;
  if (options.relativeTo) linkConfig.origin = options.relativeTo.uuid;

  for (const val of parsedConfig.values) {
    if (val.includes("Actor.")) {
      const idx = fromUuidSync(val);
      if (idx) {
        linkConfig.type = "direct";
        linkConfig.actor = idx.uuid;
      }
    }

    if (summoner) {
      const portfolioItem = summoner.items.find(i => i.dsid === val);
      if (portfolioItem) {
        linkConfig.type = "portfolio";
        linkConfig.portfolio = val;
        linkConfig.summonItem = portfolioItem.id;
      }
    }
  }

  // Chat messages are missing enough info to reliably de-duplicate imports so only world actors are allowed
  if (!linkConfig.summonItem && !linkConfig.origin) {
    const parseInfo = foundry.utils.parseUuid(linkConfig.actor);
    if (parseInfo.collection instanceof foundry.documents.collections.CompendiumCollection) {
      console.error(
        `Unable to create Summon enricher using actor '${linkConfig.actor}' in a context with no source item or origin.`,
      );
      return null;
    }
  }

  switch (linkConfig.type) {
    case null:
      return null;
    case "direct":
      label ||= _loc("DRAW_STEEL.EDITOR.Enrichers.Summon.DirectLabel", { name: fromUuidSync(linkConfig.actor).name });
      break;
    case "portfolio":
      label ||= _loc("DRAW_STEEL.EDITOR.Enrichers.Summon.PortfolioLabel");
      break;
    case "companion":
      label ||= _loc("DRAW_STEEL.EDITOR.Enrichers.Summon.CompanionLabel");
      break;
  }

  return createLink(label, linkConfig, {
    icon: "fa-transporter-2",
  });
}

/* -------------------------------------------------- */

/**
 * Called when the enriched content is added to the DOM.
 * @param {HTMLEnrichedContentElement} element
 */
export async function onRender(element) {
  const link = element.querySelector("a");
  link.addEventListener("click", onClickAnchor);
}

/* -------------------------------------------------- */

/**
 * Helper function to perform a summon.
 * @this {HTMLAnchorElement}
 */
async function onClickAnchor() {
  switch (this.dataset.type) {
    case "direct": return void directSummon(this.dataset);
    case "portfolio": return void portfolioSummon(this.dataset);
    case "companion": return void companionSummon(this.dataset);
  }
}

/* -------------------------------------------------- */

/**
 * Helper function to perform a summon.
 * @param {DirectSummonConfig} config
 */
async function directSummon(config) {
  const summoner = fromUuidSync(config.summoner);
  const summonItem = summoner?.items.get(config.summonItem);
  const origin = fromUuidSync(config.origin);
  await ds.utils.performSummon(config.actor, summonItem ?? summoner ?? origin, { count: config.count ?? 1 });
}

/* -------------------------------------------------- */

/**
 * Helper function to perform a summon.
 * @param {PortfolioSummonConfig} config
 */
async function portfolioSummon(config) {
  const hero = fromUuidSync(config.summoner);

  const summonInfo = await SummonChoiceAdvancement.getSummonInfo(hero, config.portfolio, {
    signatureOnly: !!config.signatureOnly,
  });
  if (!summonInfo) return;

  const summonItem = fromUuidSync(config.summoner)?.items.get(config.summonItem);
  if (!summonItem) return;

  const tokens = await summonItem.system.performSummon(summonInfo.uuid, {
    count: summonInfo.count,
    effects: summonInfo.effects,
  });

  if (tokens.length && summonInfo.cost) {
    await hero.modifyTokenAttribute("hero.primary.value", -summonInfo.cost, true);
  }
}

/* -------------------------------------------------- */

/**
 * Helper function to perform a summon.
 * @param {CompanionSummonConfig} config
 */
async function companionSummon(config) {
  const hero = fromUuidSync(config.summoner);

  if (!hero) return;

  await CompanionChoiceAdvancement.performSummon(hero);
}
