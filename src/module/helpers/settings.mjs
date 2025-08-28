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
      initiativeMode: {
        name: "DRAW_STEEL.Combat.Initiative.Modes.Label",
        hint: "DRAW_STEEL.Combat.Initiative.Modes.Hint",
        type: new fields.StringField({ choices: ds.CONST.initiativeModes, initial: "default", required: true }),
        config: true,
        scope: "world",
      },
      heroTokens: {
        name: HeroTokenModel.label,
        hint: HeroTokenModel.hint,
        type: HeroTokenModel,
        scope: "world",
        default: { value: 0 },
        onChange: () => ui.players.render(),
      },
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
