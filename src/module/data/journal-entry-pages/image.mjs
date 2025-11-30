import ReferenceData from "./reference.mjs";

export default class DrawSteelImageData extends ReferenceData {
  /** @inheritdoc */
  static get metadata() {
    return { type: "image" };
  }

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    const schema = super.defineSchema();

    const fields = foundry.data.fields;

    schema.artDescription = new fields.StringField();

    return {};
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    config.alt ??= this.artDescription;

    return this.parent._embedImagePage(config, options);
  }
}
