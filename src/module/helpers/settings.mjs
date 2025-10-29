import { systemID } from "../constants.mjs";
import { HeroTokenModel, MaliceModel } from "../data/settings/_module.mjs";

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * Helper class for setting registration.
 * Never actually constructed, only used to group static methods.
 */
export default class DrawSteelSettingsHandler {
  /**
   * All settings associated with the system.
   * @type {Record<string, SettingConfig>}
   */
  static get systemSettings() {
    return {
      migrationVersion: {
        name: "DRAW_STEEL.Setting.MigrationVersion.Label",
        hint: "DRAW_STEEL.Setting.MigrationVersion.Hint",
        type: new fields.StringField({ required: true }),
        default: "",
        scope: "world",
      },
      // Can be accessed at game.combats.isDefaultInitiativeMode
      initiativeMode: {
        name: "DRAW_STEEL.Combat.Initiative.Modes.Label",
        hint: "DRAW_STEEL.Combat.Initiative.Modes.Hint",
        type: new fields.StringField({ choices: ds.CONST.initiativeModes, initial: "default", required: true }),
        config: true,
        scope: "world",
        // HBS Mixin does not like adding/deleting parts so need full re-render
        requiresReload: true,
      },
      // Can be accessed at game.actors.heroTokens
      heroTokens: {
        name: HeroTokenModel.label,
        hint: HeroTokenModel.hint,
        type: HeroTokenModel,
        scope: "world",
        default: { value: 0 },
        onChange: () => ui.players.render(),
      },
      // Can be accessed at game.actors.malice
      malice: {
        name: MaliceModel.label,
        hint: MaliceModel.hint,
        type: MaliceModel,
        scope: "world",
        default: { value: 0 },
        onChange: MaliceModel.onChange,
      },
      showPlayerMalice: {
        name: "DRAW_STEEL.Setting.ShowPlayerMalice.Label",
        hint: "DRAW_STEEL.Setting.ShowPlayerMalice.Hint",
        type: new fields.BooleanField(),
        config: true,
        scope: "world",
        onChange: () => ui.players.render(),
      },
      updateFromCompendium: {
        name: "DRAW_STEEL.Setting.UpdateFromCompendium.Label",
        hint: "DRAW_STEEL.Setting.UpdateFromCompendium.Hint",
        type: new fields.NumberField({ required: true, initial: CONST.USER_ROLES.ASSISTANT, choices: () => {
          return Object.entries(CONST.USER_ROLES).reduce((obj, [key, value]) => {
            if (value) obj[key] = game.i18n.localize(`USER.Role${key.titleCase()}`);
            return obj;
          }, {});
        } }),
        config: true,
        scope: "world",
      },
      projectEvents: {
        name: "DRAW_STEEL.Setting.ProjectEvents.Label",
        hint: "DRAW_STEEL.Setting.ProjectEvents.Hint",
        type: new fields.StringField({ choices: ds.CONST.projectEventOptions, initial: "none", required: true }),
        config: true,
        scope: "world",
        onChange: () => ui.players.render(),
      },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Helper function called in the `init` hook.
   */
  static registerSettings() {
    for (const [key, value] of Object.entries(this.systemSettings)) {
      game.settings.register(systemID, key, value);
    }
  }
}
