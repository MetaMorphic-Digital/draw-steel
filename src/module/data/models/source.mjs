/** @import BasePackage from "@common/packages/base-package.mjs"; */
/** @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs" */

const fields = foundry.data.fields;

/**
 * Data model.
 */
export default class SourceModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      book: new fields.StringField({ required: true }),
      page: new fields.StringField({ required: true }),
      license: new fields.StringField({ required: true }),
    };
  }

  /* -------------------------------------------- */

  /**
   * Get the package associated with the given UUID, if any.
   * @param {string} uuid  The UUID.
   * @returns {BasePackage}
   */
  static getPackage(uuid) {
    const pack = foundry.utils.parseUuid(uuid)?.collection?.metadata;
    switch (pack?.packageType) {
      case "module": return game.modules.get(pack.packageName);
      case "system": return game.system;
      case "world": return game.world;
    }
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Fetches the document containing this model.
   * @returns {DrawSteelActor | DrawSteelItem}
   */
  get document() {
    return this.parent?.parent ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the source label.
   * @param {string} uuid  Compendium source or document UUID.
   */
  prepareData() {
    const bookLabel = game.i18n.localize(ds.CONFIG.sourceInfo.books[this.book]?.label);

    const page = Number.isNumeric(this.page)
      ? game.i18n.format("DRAW_STEEL.SOURCE.Display.Page", { page: this.page }) : (this.page ?? "");
    this.label = game.i18n.format("DRAW_STEEL.SOURCE.Display.Full", { book: bookLabel || this.book, page }).trim();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return this.label;
  }
}
