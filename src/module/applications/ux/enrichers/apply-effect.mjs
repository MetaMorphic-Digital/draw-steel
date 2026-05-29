import { createLink, parseConfig } from "../helpers.mjs";
import DrawSteelActiveEffect from "../../../documents/active-effect.mjs";

/**
 * @import { ActiveEffectData } from "@common/documents/_types.mjs";
 * @import { DatabaseWriteOperation } from "@common/abstract/_types.mjs";
 * @import { TextEditorEnricher, TextEditorEnricherConfig } from "@client/config.mjs";
 * @import HTMLEnrichedContentElement from "@client/applications/elements/enriched-content.mjs";
 * @import { ParsedConfig } from "../helpers.mjs";
 * @import { DrawSteelActor, DrawSteelItem } from "../../../documents/_module.mjs";
 * @import DrawSteelToken from "../../../canvas/placeables/token.mjs";
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
  if (parsedConfig.originDuration) linkConfig.originDuration = parsedConfig.originDuration;
  if (options.relativeTo) linkConfig.origin = options.relativeTo.uuid;

  /** @type {DrawSteelItem} */
  const doc = (["Actor", "Item"].includes(options.relativeTo?.documentName)) ? options.relativeTo : null;

  for (const val of parsedConfig.values) {

    // ID or Name
    if (doc) {
      const effect = doc.effects.get(val) || doc.effects.getName(val);
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
    const status = CONFIG.statusEffects[normalizedValue];
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

  if (parsedConfig.name) linkConfig.tooltip = _loc("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.LinkTooltip", { name: parsedConfig.name });

  label ||= linkConfig.end ?
    _loc("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.FormatString", {
      name: parsedConfig.name,
      end: _loc(`DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.EffectEnds.${linkConfig.end}`),
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
  /** @type {DrawSteelToken[]} */
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

  /** @type {Set<DrawSteelActor>} */
  const actors = new Set();

  // Need separate operations because all deletions must be done before creations to avoid id collisions
  /** @type {DatabaseWriteOperation[]} */
  const toDelete = [];
  /** @type {DatabaseWriteOperation[]} */
  const toCreate = [];

  // Only keep the initiative value if using the "alternative" (D&D style countdown) initiative.
  const keepInitiative = !game.combats.isDefaultInitiativeMode;

  // Some abilities have durations tied to the origin rather than the target.
  const origin = fromUuidSync(this.dataset.origin);
  const originActor = origin?.documentName === "Actor" ? origin : origin?.actor;
  let combatant = this.dataset.originDuration ? game.combat?.getCombatantsByActor(originActor)[0] ?? "" : null;

  for (const token of tokens) {
    const actor = token.actor;
    if (!actor) continue;
    else if (actors.has(actor)) continue;
    else actors.add(actor);

    combatant ??= game.combat?.getCombatantsByActor(actor)[0];

    /** @type {ActiveEffectData} */
    const updates = {
      start: DrawSteelActiveEffect.getEffectStart(),
      transfer: true,
      origin: this.dataset.origin,
    };
    if (this.dataset.end) updates.duration = { expiry: ds.CONFIG.effectEnds[this.dataset.end].expiryEvent };
    if (combatant) {
      updates.start.combatant = combatant;
      if (keepInitiative) updates.start.initiative = combatant.initiative;
    }
    // can't updateSource => toObject due to `origin` field triggering a warning when it checks for relative uuid
    const createData = foundry.utils.mergeObject(tempEffect.toObject(), updates);

    // reusing the ID will block creation if it's already on the actor
    const existing = actor.effects.get(tempEffect.id);
    // deleting instead of updating because there may be variances between the old copy and new
    if (existing) toDelete.push({ action: "delete", parent: actor, documentName: "ActiveEffect", ids: [tempEffect.id] });
    toCreate.push({ action: "create", parent: actor, documentName: "ActiveEffect", data: [createData], keepId: noStack });

    // statuses automatically create scrolling text themselves
    if (this.dataset.type === "custom") {
      canvas.interface.createScrollingText(token.center,
        _loc("DRAW_STEEL.EDITOR.Enrichers.ApplyEffect.CreateText", { name: tempEffect.name }),
        {
          fill: "white",
          fontSize: 32,
          stroke: 0x000000,
          strokeThickness: 4,
        });
    }
  }

  await foundry.documents.modifyBatch(toDelete);
  await foundry.documents.modifyBatch(toCreate);
}
