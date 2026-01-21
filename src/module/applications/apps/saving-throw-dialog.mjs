import { systemPath } from "../../constants.mjs";
import RollDialog from "../api/roll-dialog.mjs";

const { FormDataExtended } = foundry.applications.ux;

/**
 * A roll dialog for Saving Throws.
 * @see {@link ds.rolls.SavingThrowRoll | SavingThrowRoll}
 */
export default class SavingThrowDialog extends RollDialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    window: {
      title: "DRAW_STEEL.ROLL.Save.Prompt.Title",
    },
    classes: ["saving-throw-dialog"],
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format(this.options.window.title, {
      effect: this.options.context.effect.name,
    });
  }

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
   * Amend the situational bonus and success threshold based on changed values.
   * @inheritdoc
   */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = foundry.utils.expandObject(new FormDataExtended(this.element).object);

    foundry.utils.mergeObject(this.options.context, formData);

    this.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    return {
      rollConfig: formData,
      rollMode: this.options.context.rollMode,
    };
  }
}
