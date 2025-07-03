import { systemID } from "../../constants.mjs";

/**
 * The Application responsible for configuring a single Wall document.
 */
export default class DrawSteelWallConfig extends foundry.applications.sheets.WallConfig {
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = game.i18n.localize("DRAW_STEEL.Wall.Config.Legend");

    const checkbox = foundry.applications.fields.createCheckboxInput({
      name: `flags.${systemID}.blocksLineOfEffect`,
      value: this.document.blocksLineOfEffect,
    });
    const formGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Wall.Config.BlocksLineOfEffect.label",
      hint: "DRAW_STEEL.Wall.Config.BlocksLineOfEffect.hint",
      input: checkbox,
      localize: true,
    });
    fieldset.append(legend, formGroup);

    this.element.querySelector("div.standard-form").append(fieldset);
  }
}
