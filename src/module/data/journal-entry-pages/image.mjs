import ReferenceData from "./reference.mjs";

export default class DrawSteelImageData extends ReferenceData {
  /** @inheritdoc */
  static get metadata() {
    return { type: "image" };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = super.LOCALIZATION_PREFIXES.concat(["DRAW_STEEL.JournalEntryPage.image"]);

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      artDescription: new foundry.data.fields.StringField({ required: true }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    config.alt ??= this.artDescription;

    return this.parent._embedImagePage(config, options);
  }
}
