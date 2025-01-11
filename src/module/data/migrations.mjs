import {systemID} from "../constants.mjs";

/**
 * Perform one-time migrations
 * Run and awaited in the `ready` hook before `ds.ready` is called.
 */
export async function migrateWorld() {
  // TODO: In v13 simplify to the new getter
  if (!game.users.activeGM.isSelf) {
    console.log("Not the active GM");
    return;
  }
  const migrationVersion = game.settings.get(systemID, "migrationVersion");
  if (!migrationVersion) {
    // New world - initialize the migration version and rename Gamemaster to Director
    await game.users.activeGM.update({name: game.i18n.localize("USER.RoleGamemaster")});
    await game.settings.set(systemID, "migrationVersion", game.system.version);
  }
}
