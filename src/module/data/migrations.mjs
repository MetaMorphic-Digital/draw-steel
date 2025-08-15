import { systemID } from "../constants.mjs";

/**
 * @import DocumentCollection from "@client/documents/abstract/document-collection.mjs";
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
    await migrateType(game.actors);
    warning.update({ pct: 0.5 });
    await migrateType(game.items);
    ui.notifications.remove(warning);
    ui.notifications.success("DRAW_STEEL.Setting.MigrationVersion.WorldSuccess", { format: { version: "0.8.0" } });
    updateVersion = true;
  }
  if (updateVersion) await game.settings.set(systemID, "migrationVersion", game.system.version);
}

/**
 * Migrate the types of documents in the collection.
 * @param {DocumentCollection<Document> | EmbeddedCollection<Document>} collection
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
    const migrationResults = await collection.documentClass.updateDocuments(updateData, { pack: options.pack, parent: options.parent, diff: false });
    console.log(migrationResults);
  }
}
