import { systemID } from "../constants.mjs";

/**
 * @import DocumentCollection from "@client/documents/abstract/document-collection.mjs";
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 * @import {Document, EmbeddedCollection} from "@common/abstract/_module.mjs";
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
    await game.users.activeGM.update({ name: game.i18n.localize("USER.RoleGamemaster") });
    updateVersion = true;
  }
  else if (foundry.utils.isNewerVersion("0.8.0", migrationVersion)) {
    const warning = ui.notifications.warn("DRAW_STEEL.Setting.MigrationVersion.WorldWarning", { format: { version: "0.8.0" }, progress: true });
    let pct = 0;

    console.log("Migrating world actors");
    await migrateType(game.actors);
    pct += 0.2;
    warning.update({ pct });

    console.log("Migrating world items");
    await migrateType(game.items);
    pct += 0.3;
    warning.update({ pct });

    for (const actor of game.actors) {
      console.log("Migrating items inside", actor.name);
      await migrateType(actor.items, { parent: actor });
      pct += (0.3 / game.actors.size);
      warning.update({ pct });
    }

    // Current migration does not search for items created inside deltas
    // if that is ever necessary, expand to loop through game.scenes => scene.tokens

    const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p));
    for (const pack of packsToMigrate) {
      console.log("Migrating document inside", pack.title);
      await pack.getDocuments();
      const wasLocked = pack.config.locked;
      if (wasLocked) await pack.configure({ locked: false });
      await migrateType(pack);
      if (pack.documentName === "Actor") {
        for (const actor of pack) await migrateType(actor.items, { parent: actor, pack: pack.collection });
      }
      if (wasLocked) await pack.configure({ locked: true });
      pct += (0.2 / packsToMigrate.length);
      warning.update({ pct });
    }

    ui.notifications.remove(warning);
    ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "0.8.0" }, permanent: true });
    console.log("Migration complete");
    updateVersion = true;
  }
  if (updateVersion) await game.settings.set(systemID, "migrationVersion", game.system.version);
}

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
    "==system": doc.system.toObject(),
    "flags.draw-steel.-=migrateType": null,
  }));
  // update in increments of 100
  const batches = Math.ceil(toMigrate.length / 100);
  for (let i = 0; i < batches; i++) {
    const updateData = toMigrate.slice(i * 100, (i + 1) * 100);
    await collection.documentClass.updateDocuments(updateData, { pack: options.pack, parent: options.parent, diff: false });
  }
}

/**
 * Determine whether a compendium pack should be migrated during `migrateWorld`.
 * @param {CompendiumCollection} pack
 * @returns {boolean}
 */
function shouldMigrateCompendium(pack) {
  // We only care about actor and item migrations
  if (!["Actor", "Item"].includes(pack.documentName)) return false;

  // World compendiums should all be migrated, system ones should never by migrated
  if (pack.metadata.packageType === "world") return true;
  if (pack.metadata.packageType === "system") return false;

  // Module compendiums should only be migrated if they don't have a download or manifest URL
  const module = game.modules.get(pack.metadata.packageName);
  return !module.download && !module.manifest;
}
