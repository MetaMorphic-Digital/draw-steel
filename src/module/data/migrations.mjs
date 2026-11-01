import { systemID } from "../constants.mjs";

/**
 * @import DocumentCollection from "@client/documents/abstract/document-collection.mjs";
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 * @import {Document, EmbeddedCollection} from "@common/abstract/_module.mjs";
 * @import {DatabaseWriteOperation} from "@common/abstract/_types.mjs";
 */

/**
 * Perform one-time migrations
 * Run and awaited in the `ready` hook before `ds.ready` is called.
 */
export async function migrateWorld() {
  if (!game.user.isActiveGM) {
    console.debug("Not the active GM");
    return;
  }
  const migrationVersion = game.settings.get(systemID, "migrationVersion");
  let updateVersion = false;
  if (!migrationVersion) {
    // New world - initialize the migration version and rename Gamemaster to Director
    if (game.user.name === "Gamemaster") await game.user.update({ name: _loc("USER.RoleGamemaster") });
    updateVersion = true;
  }
  else {
    if (foundry.utils.isNewerVersion("0.8.0", migrationVersion)) {
      await version_0_8_migration();
      updateVersion = true;
    }
    if (foundry.utils.isNewerVersion("0.10.0", migrationVersion)) {
      await version_0_10_migration();
      updateVersion = true;
    }
    if (foundry.utils.isNewerVersion("0.11.0", migrationVersion)) {
      await version_0_11_migration();
      updateVersion = true;
    }
    if (foundry.utils.isNewerVersion("1.0.0", migrationVersion)) {
      await version_1_0_migration();
      updateVersion = true;
    }
    if (foundry.utils.isNewerVersion("1.1.0", migrationVersion)) {
      await version_1_1_migration();
      updateVersion = true;
    }
  }
  if (updateVersion) await game.settings.set(systemID, "migrationVersion", game.system.version);
}

/* -------------------------------------------------- */

/**
 * Migrates heroes and various feature subtype items for version 0.8.0.
 */
async function version_0_8_migration() {
  const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "0.8.0" }, progress: true });

  console.log("Migrating world actors");
  await migrateType(game.actors);
  warning.update({ pct: 0.2 });

  console.log("Migrating world items");
  await migrateType(game.items);
  warning.update({ pct: 0.5 });

  for (const actor of game.actors) {
    console.log("Migrating items inside", actor.name);
    await migrateType(actor.items, { parent: actor });
  }
  warning.update({ pct: 0.8 });

  // Current migration does not search for items created inside deltas
  // if that is ever necessary, expand to loop through game.scenes => scene.tokens

  const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p, ["Actor", "Item"]));
  for (const pack of packsToMigrate) {
    console.log("Migrating document inside", pack.title);
    await pack.getDocuments();
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });
    await migrateType(pack, { pack: pack.collection });
    if (pack.documentName === "Actor") {
      for (const actor of pack) await migrateType(actor.items, { parent: actor, pack: pack.collection });
    }
    if (wasLocked) await pack.configure({ locked: true });
  }
  warning.update({ pct: 1.0 });

  ui.notifications.remove(warning);
  ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "0.8.0" }, permanent: true });
  console.log("Migration complete");
}

/* -------------------------------------------------- */

/**
 * Migrates chat messages for version 0.10.0.
 */
async function version_0_10_migration() {
  const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "0.10.0" }, progress: true });

  console.log("Migrating chat messages");
  await migrateType(game.messages);
  warning.update({ pct: 1.00 });

  ui.notifications.remove(warning);
  ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "0.10.0" }, permanent: true });
  console.log("Migration complete");
}

/* -------------------------------------------------- */

/**
 * Migrate active effect keys for version 0.11.0.
 */
async function version_0_11_migration() {
  const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "0.11.0" }, progress: true });

  console.log("Migrating active effects inside actors");
  for (const actor of game.actors) {
    await migrateChanges(actor);
  }
  warning.update({ pct: 0.4 });
  console.log("Migrating active effects inside items");
  for (const item of game.items) {
    await migrateChanges(item);
  }
  warning.update({ pct: 0.7 });

  // Current migration does not search for effects created inside deltas
  // if that is ever necessary, expand to loop through game.scenes => scene.tokens

  const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p, ["Actor", "Item"]));
  for (const pack of packsToMigrate) {
    console.log("Migrating document inside", pack.title);
    const docs = await pack.getDocuments();
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });
    for (const doc of docs) await migrateChanges(doc);
    if (wasLocked) await pack.configure({ locked: true });
  }

  warning.update({ pct: 1.00 });

  ui.notifications.remove(warning);
  ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "0.11.0" }, permanent: true });
  console.log("Migration complete");
}

/* -------------------------------------------------- */

/**
 * Migrate active effect keys and expiries for version 1.0.0.
 */
async function version_1_0_migration() {

  const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "1.0.0" }, progress: true });

  console.log("Migrating active effects inside actors");
  for (const actor of game.actors) {
    const operation = [];
    migrateEffectSystem(actor, operation);
    await foundry.documents.modifyBatch(operation);
  }
  warning.update({ pct: 0.2 });
  console.log("Migrating active effects inside items");
  const worldItemOperation = [];
  for (const item of game.items) {
    migrateEffectSystem(item, worldItemOperation);
  }
  await foundry.documents.modifyBatch(worldItemOperation);
  warning.update({ pct: 0.4 });

  for (const scene of game.scenes) {
    const operation = [];
    for (const token of scene.tokens) {
      if (!token.actor) continue;
      migrateEffectSystem(token.actor, operation);
    }
    await foundry.documents.modifyBatch(operation);
  }
  warning.update({ pct: 0.8 });

  const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p, ["Actor", "Item"]));
  for (const pack of packsToMigrate) {
    console.log("Migrating document inside", pack.title);
    const docs = await pack.getDocuments();
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });
    const operation = [];
    docs.forEach(doc => migrateEffectSystem(doc, operation));
    await foundry.documents.modifyBatch(operation);
    if (wasLocked) await pack.configure({ locked: true });
  }

  warning.update({ pct: 1.00 });

  ui.notifications.remove(warning);
  ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "1.0.0" }, permanent: true });
  console.log("Migration complete");
}

/* -------------------------------------------------- */

/**
 * Migrate abilities for version 1.1.0.
 */
async function version_1_1_migration() {

  const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "1.1.0" }, progress: true });

  await migrateActorItems(game.actors);

  warning.update({ pct: 0.3 });

  for (const scene of game.scenes) {
    const operation = scene.tokens.map(t => {
      if (t.isLinked || !t.delta || !t.baseActor) return null;
      return {
        action: "update",
        updates: t.actor.itemTypes.ability.map(i => ({ _id: i.id, system: _replace(i.system.toObject()) })),
        documentName: "Item",
        parent: t.actor,
      };
    }).filter(_ => _);
    await foundry.documents.modifyBatch(operation);
  }

  warning.update({ pct: 0.5 });

  const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p, ["Actor", "Item"]));
  for (const pack of packsToMigrate) {
    console.log("Migrating document inside", pack.title);
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });
    if (pack.documentName === "Actor") {
      await pack.getDocuments();
      await migrateActorItems(pack);
    }
    else {
      const docs = await pack.getDocuments({ type: "ability" });
      const updates = docs.map(i => ({ _id: i.id, system: _replace(i.system.toObject()) }));
      await foundry.documents.Item.updateDocuments(updates, { pack: pack.collection });
    }
    if (wasLocked) await pack.configure({ locked: true });
  }

  warning.update({ pct: 1.00 });

  ui.notifications.remove(warning);
  ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "1.1.0" }, permanent: true });
  console.log("Migration complete");
}

/* -------------------------------------------------- */

/**
 * @typedef {DocumentCollection<Document> | EmbeddedCollection<Document> | CompendiumCollection<Document>} AnyCollection
 */

/**
 * Migrate the types of documents in the collection.
 * @param {AnyCollection} collection
 * @param {object} [options={}]       Options forwarded to the document update operation.
 * @param {string} [options.pack]     Pack to update.
 * @param {Document} [options.parent] Parent of the collection for embedded collections.
 */
export async function migrateType(collection, options = {}) {
  const toMigrate = collection.filter(doc => doc.getFlag(systemID, "migrateType")).map(doc => ({
    _id: doc.id,
    type: doc.type,
    system: _replace(doc.system.toObject()),
    "flags.draw-steel.migrateType": _del,
  }));
  // update in increments of 100
  const batches = Math.ceil(toMigrate.length / 100);
  for (let i = 0; i < batches; i++) {
    const updateData = toMigrate.slice(i * 100, (i + 1) * 100);
    await collection.documentClass.updateDocuments(updateData, { pack: options.pack, parent: options.parent, diff: false });
  }
}

/* -------------------------------------------------- */

/**
 * Migrate all effects in an Actor or Item.
 * @param {foundry.documents.Actor | foundry.documents.Item} parentDocument If this is an Actor, also migrate effects on items.
 */
export async function migrateChanges(parentDocument) {
  const toMigrate = parentDocument.effects.filter(effect => effect.getFlag(systemID, "migrateChanges")).map(doc => ({
    _id: doc.id,
    "system.changes": [...doc.system.changes],
    "flags.draw-steel.migrateChanges": _del,
  }));

  await parentDocument.updateEmbeddedDocuments("ActiveEffect", toMigrate);
  if (parentDocument.documentName === "Item") return;
  const promises = [];
  for (const item of parentDocument.items) promises.push(migrateChanges(item));
  return Promise.allSettled(promises);
}

/* -------------------------------------------------- */

/**
 * Construct migration data for all effects in an Actor or Item.
 * @param {foundry.documents.Actor | foundry.documents.Item} parentDocument If this is an Actor, also migrate effects on items.
 * @param {DatabaseWriteOperation[]} operation An operation array to push to.
 */
export function migrateEffectSystem(parentDocument, operation) {
  const updates = parentDocument.effects.filter(effect => effect.getFlag(systemID, "migrateChanges") || effect.getFlag(systemID, "oldExpiry")).map(doc => {
    const updateData = {
      _id: doc.id,
      system: _replace(doc.system.toObject()),
      "flags.draw-steel": {
        migrateChanges: _del,
        oldExpiry: _del,
      },
    };

    const oldExpiry = doc.getFlag(systemID, "oldExpiry");
    if (oldExpiry) updateData["duration.expiry"] = ds.CONFIG.effectEnds[oldExpiry]?.expiryEvent;

    return updateData;
  });

  operation.push({
    updates,
    action: "update",
    documentName: "ActiveEffect",
    parent: parentDocument,
  });

  if (parentDocument.documentName === "Actor") {
    for (const item of parentDocument.items) migrateEffectSystem(item, operation);
  }
}

/* -------------------------------------------------- */

/**
 * Force-updates the `system` property of all ability items in the provided actor collection.
 * @param {AnyCollection} actorCollection
 */
export async function migrateActorItems(actorCollection) {
  const operation = [];
  let count = 0;
  for (const actor of actorCollection) {
    const updateOperation = {
      action: "update",
      updates: actor.items.documentsByType.ability.map(i => ({ _id: i.id, system: _replace(i.system.toObject()) })),
      documentName: "Item",
      parent: actor,
    };
    count += updateOperation.updates.length;
    operation.push(updateOperation);
    if (count >= 100) {
      await foundry.documents.modifyBatch(operation);
      operation.length = 0;
      count = 0;
    }
  }
  if (operation.length) await foundry.documents.modifyBatch(operation);
}

/* -------------------------------------------------- */

/**
 * Determine whether a compendium pack should be migrated during `migrateWorld`.
 * @param {CompendiumCollection} pack
 * @param {string[]} [types=["Actor", "Item", "ActiveEffect"]] Document names to migrate.
 * @returns {boolean}
 */
function shouldMigrateCompendium(pack, types = ["Actor", "Item", "ActiveEffect"]) {
  if (!types.includes(pack.documentName)) return false;

  // World compendiums should all be migrated, system ones should never by migrated
  if (pack.metadata.packageType === "world") return true;
  if (pack.metadata.packageType === "system") return false;

  // Module compendiums should only be migrated if they don't have a download or manifest URL
  const module = game.modules.get(pack.metadata.packageName);
  return !module.download && !module.manifest;
}
