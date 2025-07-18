/**
 * An extension of DialogV2 that adjusts the defaults for the system.
 */
export default class DSDialog extends foundry.applications.api.Dialog {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
    position: {
      width: 400,
      height: "auto",
    },
  };
}
