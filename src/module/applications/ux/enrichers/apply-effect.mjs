import DrawSteelActiveEffect from "../../../documents/active-effect.mjs";
import { createLink, parseConfig } from "../helpers.mjs";

/**
 * @import { ActiveEffectData } from "@common/documents/_types.mjs";
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 * @import { ParsedConfig } from "../helpers.mjs";
 * @import DrawSteelItem from "../../../documents/item.mjs";
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
export async function enricher(match, options) {
  let { config, label } = match.groups;

  /** @type {ParsedConfig} */
  const parsedConfig = parseConfig(config);
  parsedConfig._input = match[0];

  const linkConfig = {};

  if (parsedConfig.end) linkConfig.end = parsedConfig.end;
  if (parsedConfig.status) linkConfig.status = parsedConfig.status;
  if (parsedConfig.uuid) linkConfig.uuid = parsedConfig.uuid;
  if (parsedConfig.stacking) linkConfig.stacking = parsedConfig.stacking;
  if (options.relativeTo) linkConfig.origin = options.relativeTo.uuid;

  /** @type {DrawSteelItem} */
  const item = (options.relativeTo?.documentName === "Item") ? options.relativeTo : null;

  for (const val of parsedConfig.values) {

    // ID or Name
    if (item) {
      const effect = item.effects.get(val) || item.effects.getName(val);
      if (effect) {
        linkConfig.type = "custom";
        linkConfig.uuid = effect.uuid;
        parsedConfig.name ||= effect.name;
        continue;
      }
    }

    const normalizedValue = val.toLowerCase();

    // End adjustment
    if (normalizedValue in ds.CONFIG.effectEnds) {
      linkConfig.end = normalizedValue;
      continue;
    }

    // Canonical Statuses
    const status = CONFIG.statusEffects.find(s => s.id === normalizedValue);
    if (status) {
      linkConfig.type = "status";
      linkConfig.status = status.id;
      parsedConfig.name ||= status.name;
      continue;
    }

    // Possibly relative UUID
    const uuidInfo = foundry.utils.parseUuid(val, { relative: options.relativeTo });
    if (uuidInfo.type === "ActiveEffect") {
      linkConfig.type = "custom";
      linkConfig.uuid = uuidInfo.uuid;
      const effect = await fromUuid(uuidInfo.uuid);
      if (effect) parsedConfig.name ||= effect.name;
    }
  }

  if (!linkConfig.type) return null;

  if (parsedConfig.name) linkConfig.tooltip = game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.LinkTooltip", { name: parsedConfig.name });

  label ||= linkConfig.end ?
    game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.FormatString", {
      name: parsedConfig.name,
      end: game.i18n.localize(`DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.EffectEnds.${linkConfig.end}`),
    }) :
    parsedConfig.name;

  return createLink(label, linkConfig, {
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

  link.addEventListener("click", onClickAnchor);
}

/**
 * Helper function to apply the effect to a selected token's actor.
 * @this {HTMLAnchorElement}
 */
async function onClickAnchor() {
  const tokens = canvas?.tokens?.controlled ?? [];
  if (!tokens.length) {
    ui.notifications.error("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.NoSelection", { localize: true });
    return;
  }

  const noStack = !this.dataset.stacking;

  /** @type {DrawSteelActiveEffect} */
  const tempEffect = this.dataset.type === "custom" ?
    (await fromUuid(this.dataset.uuid)).clone({}, { keepId: noStack, addSource: true }) :
    await DrawSteelActiveEffect.fromStatusEffect(this.dataset.status);

  /** @type {ActiveEffectData} */
  const updates = {
    transfer: true,
    origin: this.dataset.origin,
    system: {},
  };

  if (this.dataset.end) updates.system.end = { type: this.dataset.end };
  tempEffect.updateSource(updates);

  const actors = new Set();

  // TODO: Update when https://github.com/foundryvtt/foundryvtt/issues/11898 is implemented
  for (const token of tokens) {
    const actor = token.actor;
    if (!actor) continue;
    else if (actors.has(actor)) continue;
    else actors.add(actor);

    // statuses automatically create scrolling text themselves
    if (this.dataset.type === "status") {
      // reusing the ID will block creation if it's already on the actor
      const existing = actor.effects.get(tempEffect.id);
      // deleting instead of updating because there may be variances between the old copy and new
      if (existing && existing.disabled) await existing.delete();

      // not awaited to allow parallel processing
      actor.createEmbeddedDocuments("ActiveEffect", [tempEffect.toObject()], { keepId: noStack });
    } else {

      // not awaited to allow parallel processing
      actor.createEmbeddedDocuments("ActiveEffect", [tempEffect.toObject()], { keepId: noStack });

      const scrollingTextArgs = [
        token.center,
        game.i18n.format("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.CreateText", { name: tempEffect.name }),
        {
          fill: "white",
          fontSize: 32,
          stroke: 0x000000,
          strokeThickness: 4,
        },
      ];

      canvas.interface.createScrollingText(...scrollingTextArgs);
    }
  }
}
