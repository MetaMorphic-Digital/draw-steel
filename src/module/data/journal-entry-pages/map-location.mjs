const { StringField } = foundry.data.fields;

/**
 * An extension of text page that allows specifying a map key.
 */
export default class MapLocationModel extends foundry.abstract.TypeDataModel {
  /**
   * Subtype metadata.
   * @type {object}
   */
  static metadata = {
    type: "map",
  };

  /* -------------------------------------------------- */

  /** @inheritDoc */
  static defineSchema() {
    return {
      code: new StringField(),
    };
  }

  /* -------------------------------------------- */

  /**
   * Prepare the code used for this page when shown in the ToC of a journal entry sheet.
   * A truthy value is required for the value to take effect.
   * @returns {string|number|null}    A string or number to display.
   */
  prepareCode() {
    return this.code || null;
  }

  /* -------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
