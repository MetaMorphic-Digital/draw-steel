import { systemPath } from "../../constants.mjs";
import RollDialog from "../api/roll-dialog.mjs";

export default class SavingThrowRollDialog extends RollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    window: {
      title: "DRAW_STEEL.Roll.Save.Prompt.Title",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/rolls/saving-throw-dialog.hbs"),
    },
    footer: super.PARTS.footer,
  };
}
