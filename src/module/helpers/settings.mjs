import {systemID} from "../constants.mjs";
import {HeroTokenModel, MaliceModel} from "../data/settings/_module.mjs";

/** @import {SettingConfig} from "../../../foundry/common/types.mjs" */

const fields = foundry.data.fields;

export default class DrawSteelSettingsHandler {
  /**
   * @type {Record<string, SettingConfig>}
   */
  static get systemSettings() {
    return {
      initiativeMode: {
        name: "DRAW_STEEL.Combat.Initiative.Modes.Label",
        hint: "DRAW_STEEL.Combat.Initiative.Modes.Hint",
        type: new fields.StringField({choices: ds.CONST.initiativeModes, initial: "default"}),
        config: true,
        scope: "world"
      },
      heroTokens: {
        name: HeroTokenModel.label,
        hint: HeroTokenModel.hint,
        type: HeroTokenModel,
        scope: "world",
        default: {value: 0}
      },
      malice: {
        name: MaliceModel.label,
        hint: MaliceModel.hint,
        type: MaliceModel,
        scope: "world",
        default: {value: 0}
      }
    };
  }

  static registerSettings() {
    for (const [key, value] of Object.entries(this.systemSettings)) {
      game.settings.register(systemID, key, value);
    }
  }
}
