import {systemID} from "../constants.mjs";

const fields = foundry.data.fields;

export default class DrawSteelSettingsHandler {
  static registerSettings() {
    game.settings.register(systemID, "initiativeMode", {
      name: "DRAW_STEEL.Combat.Initiative.Modes.Label",
      hint: "DRAW_STEEL.Combat.Initiative.Modes.Hint",
      type: new fields.StringField({choices: ds.CONST.initiativeModes, initial: "default"}),
      config: true,
      scope: "world"
    });
  }
}
