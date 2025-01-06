import {systemID} from "../constants.mjs";

export async function migrateWorld() {
  const migrationVersion = game.settings.get(systemID, "migrationVersion");
  if (!migrationVersion) {
    // New world - initialize the migration version and rename Gamemaster to Director
    await game.users.activeGM.update({name: game.i18n.localize("USER.RoleGamemaster")});
    await game.settings.set(systemID, "migrationVersion", game.system.version);
  }
}
