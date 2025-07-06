import { systemPath } from "../../constants.mjs";
import RollDialog from "../api/roll-dialog.mjs";

const { FormDataExtended } = foundry.applications.ux;

export default class SavingThrowDialog extends RollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    window: {
      title: "DRAW_STEEL.Roll.Save.Prompt.Title",
    },
    classes: ["saving-throw-dialog"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    content: {
      template: systemPath("templates/apps/saving-throw-dialog.hbs"),
    },
    footer: super.PARTS.footer,
  };

  /* -------------------------------------------------- */

  /**
   * Amend the global modifiers and target specific modifiers based on changed values
   * @inheritdoc
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    foundry.utils.mergeObject(this.options.context, formData);

    this.render();
  }
}
