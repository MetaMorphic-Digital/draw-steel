/** @import BasePackage from "../../../../foundry/common/packages/base-package.mjs"; */

const fields = foundry.data.fields;

/**
 * Data model
 */
export default class SourceModel extends foundry.abstract.DataModel {
  static LOCALIZATION_PREFIXES = ["DRAW_STEEL.Source"];

  static defineSchema() {
    return {
      book: new fields.StringField({required: true}),
      page: new fields.StringField({required: true}),
      license: new fields.StringField({required: true}),
      revision: new fields.NumberField({initial: 1})
    };
  }

  /* -------------------------------------------- */

  /**
   * Check if the provided package has any source books registered in its manifest. If it has only one, then return
   * that book's key.
   * @param {BasePackage} pkg  The package.
   * @returns {string|null}
   */
  static getModuleBook(pkg) {
    if (!pkg) return null;
    const sourceBooks = foundry.utils.getProperty(pkg, "flags.draw-steel.sourceBooks");
    const keys = Object.keys(sourceBooks ?? {});
    if (keys.length !== 1) return null;
    return keys[0];
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

  /**
   * Prepare the source label.
   * @param {string} uuid  Compendium source or document UUID.
   */
  prepareData(uuid) {
    const pkg = SourceModel.getPackage(uuid);
    this.bookPlaceholder ??= SourceModel.getModuleBook(pkg) ?? "";
    if (!this.book) this.book = this.bookPlaceholder;

    const page = Number.isNumeric(this.page)
      ? game.i18n.format("DRAW_STEEL.Source.Display.Page", {page: this.page}) : (this.page ?? "");
    this.label = game.i18n.format("DRAW_STEEL.Source.Display.Full", {book: this.book, page}).trim();

    this.value = this.book || (pkg?.title ?? "");
    this.slug = this.value.slugify({strict: true});
  }

  /** @override */
  toString() {
    return this.label;
  }
}
