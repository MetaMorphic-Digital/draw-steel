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
  if (!migrationVersion) {
    // New world - initialize the migration version and rename Gamemaster to Director
    await game.users.activeGM.update({ name: game.i18n.localize("USER.RoleGamemaster") });
    await game.settings.set(systemID, "migrationVersion", game.system.version);
  }
  else if (foundry.utils.isNewerVersion("0.8.0", migrationVersion)) {
    await migrateType(game.actors);
    await migrateType(game.items);
    // await game.settings.set(systemID, "migrationVersion", game.system.version);
  }
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
    "==system": doc.system.toObject(),
    "flags.draw-steel.-=migrateType": null,
  }));
  console.log(collection, toMigrate);
  // collection.documentClass.updateDocuments(toMigrate, { pack: options.pack, parent: options.parent });
}
